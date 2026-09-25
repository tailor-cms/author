import type {
  CreateThreadInput,
  MessageFilter,
  ThreadFilter,
} from './schemas/index.ts';
import type { Repository } from '../../repository/models/repository.model.js';
import type { Thread } from './models/thread.model.js';
import type { User } from '../../user/models/user.model.js';
import type { WhereOptions } from 'sequelize';

import {
  ThreadForbiddenError,
  ThreadNotDeletableError,
  ThreadNotResolvableError,
  UnanchoredMessageError,
} from '../errors.ts';
import { ThreadScope, ThreadType } from '@tailor-cms/interfaces/comment';
import { clearMentions, countUnreadMentions } from '../mention.service.ts';
import * as commentService from '../comment.service.ts';
import { Op, Sequelize } from 'sequelize';
import { Thread as Events } from '@tailor-cms/common/src/sse.js';
import { createLogger } from '#logger';
import { subQuery } from '#shared/database/helpers.js';
import db from '#shared/database/index.js';
import sse from '#shared/sse/index.js';

// Models are resolved lazily
const models = () => db as any;
const orm = () => (db as any).sequelize;
const { col, fn, literal: lit } = Sequelize;
const logger = createLogger('messaging:thread');

// Anchored threads hang off an activity or an element and close out by
// being resolved. A free-standing thread never closes out; it is
// deleted; it has nothing to resolve.
const isAnchored = (thread: Thread) => thread.type !== ThreadType.Repository;

// Resolved: anchored, has messages, nothing left open.
const RESOLVED_SQL = `(
  "thread"."type" <> '${ThreadType.Repository}'
  AND "thread"."message_count" > 0
  AND "thread"."unresolved_count" = 0
)`;

// The reader's own row on the thread, so their watermark and star come
// back with it. Optional: a thread they never opened has none.
const readerInclude = (userId: number) => ({
  model: models().UserThread,
  as: 'reader',
  required: false,
  where: { userId },
  attributes: ['lastReadAt', 'isStarred'],
});

// Where the reader left off. Never opened reads as the beginning of
// time, which is also what a fresh row defaults to.
const WATERMARK = fn('COALESCE', col('reader.last_read_at'), new Date(0));

// Unread: something was said after the reader's watermark. One
// definition serves the flag, the filter and the badge.
const IS_UNREAD = Sequelize.where(
  WATERMARK,
  Op.lt,
  col('thread.last_message_at'),
);
const UNREAD_WHERE = {
  lastMessageAt: { [Op.ne]: null },
  [Op.and]: [IS_UNREAD],
};
// Starred by the reader; never opened sorts with unstarred.
const IS_STARRED = fn('COALESCE', col('reader.is_starred'), false);
const AUTHOR_IDS_SQL = `COALESCE(
  ARRAY_AGG(DISTINCT author_id) FILTER (WHERE author_id IS NOT NULL), '{}'
)`;

// What a thread is called: its subject, or the name of the activity
// it hangs off.
const THREAD_NAME = fn(
  'COALESCE',
  col('thread.title'),
  lit(`"activity"."data"->>'name'`),
);

// Threads called something like `name`.
const matchName = (name: string) =>
  Sequelize.where(THREAD_NAME, { [Op.iLike]: `%${name.trim()}%` });

// Scopes that need a predicate rather than a column. `mine` uses
// containment: only `@>` is answered from the GIN index on
// `participant_ids`.
type ScopePredicate = (userId: number) => WhereOptions;
const SCOPE_PREDICATE: Partial<Record<ThreadScope, ScopePredicate>> = {
  [ThreadScope.Unread]: () => UNREAD_WHERE,
  [ThreadScope.Mine]: (userId) => ({
    participantIds: { [Op.contains]: [userId] },
  }),
  [ThreadScope.Mentions]: (userId) => ({ id: mentionedThreadIds(userId) }),
  [ThreadScope.Unresolved]: () => ({ unresolvedCount: { [Op.gt]: 0 } }),
};

// Activity and element ride along so a thread can name itself, deleted
// ones included: the rail keeps showing a thread after its anchor goes.
const anchorIncludes = () => {
  const { Activity, ContentElement } = models();
  return [
    {
      model: Activity,
      attributes: ['id', 'uid', 'type', 'data'],
      required: false,
      paranoid: false,
    },
    {
      model: ContentElement,
      as: 'contentElement',
      attributes: ['id', 'uid', 'type'],
      required: false,
      paranoid: false,
    },
  ];
};

// What every thread read selects; anchors, the resolution flag and
// for a reader, their state.
const threadQuery = (userId?: number) => ({
  include: [...anchorIncludes(), ...(userId ? [readerInclude(userId)] : [])],
  attributes: {
    include: [
      [lit(RESOLVED_SQL), 'isResolved'],
      ...(userId ? [[IS_UNREAD, 'isUnread']] : []),
    ],
  },
});

// Ids of the threads holding a message that names the reader.
const mentionedThreadIds = (userId: number) => {
  const { Comment, Mention } = models();
  const mentionedCommentIds = subQuery(Mention, {
    attributes: ['commentId'],
    where: { userId },
  });
  return {
    [Op.in]: subQuery(Comment, {
      attributes: ['threadId'],
      where: { id: { [Op.in]: mentionedCommentIds } },
    }),
  };
};

// Where a comment sits: the activity or element it is on.
interface ThreadAnchor {
  repositoryId: number;
  activityId?: number | null;
  contentElementId?: number | null;
}

/**
 * The anchored thread a comment belongs to: found, or created by the
 * first comment there. A message with no anchor must name its thread.
 */
export async function findOrCreateThread(anchor: ThreadAnchor) {
  const { Thread } = models();
  const query = anchorQuery(anchor);
  if (!query) throw new UnanchoredMessageError();
  const [thread, isCreated] = await Thread.findOrCreate(query);
  if (isCreated) await broadcast(thread.id, Events.Create);
  return thread;
}

function anchorQuery(anchor: ThreadAnchor) {
  const { repositoryId, activityId, contentElementId } = anchor;
  if (contentElementId) {
    return {
      where: { repositoryId, contentElementId },
      defaults: { type: ThreadType.Element, activityId: activityId ?? null },
    };
  }
  if (activityId) {
    return { where: { repositoryId, activityId, type: ThreadType.Activity } };
  }
  return null;
}

/**
 * Opens a free-standing thread: the repository's own, with a subject
 * and its first message. The message goes through the comment service
 * so it gets the same hooks; mentions, notifications, SSE.
 */
export async function createThread(
  repository: Repository,
  user: User,
  payload: CreateThreadInput,
) {
  const { Thread } = models();
  const repositoryId = repository.id;
  const thread = await Thread.create({
    repositoryId,
    type: ThreadType.Repository,
    title: payload.title,
  });
  await broadcast(thread.id, Events.Create);
  await commentService.create(repository, user, {
    threadId: thread.id,
    content: payload.content,
  });
  logger.debug({ repositoryId, threadId: thread.id }, 'Thread opened');
  return thread;
}

/**
 * Recomputes a thread's counters from its messages.
 */
export async function touchThread(threadId: number) {
  const { Comment, Thread } = models();
  const thread = await Thread.findByPk(threadId);
  if (!thread) return null;
  const stats = await Comment.findOne({
    where: { threadId },
    attributes: [
      [lit('COUNT(*)::int'), 'messageCount'],
      [
        lit('COUNT(*) FILTER (WHERE resolved_at IS NULL)::int'),
        'unresolvedCount',
      ],
      [lit('MAX(created_at)'), 'lastMessageAt'],
      [lit(AUTHOR_IDS_SQL), 'participantIds'],
    ],
    raw: true,
  });
  // Open messages only count where they can be closed.
  if (!isAnchored(thread)) stats.unresolvedCount = 0;
  await thread.update(stats);
  return broadcast(threadId, Events.Update);
}

/**
 * Sends a thread to everyone watching the repository.
 */
export async function broadcast(threadId: number, event: string) {
  const { Thread } = models();
  const thread = await Thread.findByPk(threadId, threadQuery());
  if (!thread) return null;
  sse.channel(thread.repositoryId).send(event, thread.toJSON());
  return thread;
}

// Not persisted: a typing signal is stale within seconds.
export function broadcastTyping(
  repositoryId: number,
  threadId: number,
  user: User,
) {
  sse.channel(repositoryId).send(Events.Typing, {
    threadId,
    user: user.profile,
    at: Date.now(),
  });
}

/**
 * The Thread list; starred first then by recency;
 * each with its resolution and the caller's read state.
 */
export async function listThreads(
  repositoryId: number,
  userId: number,
  filters: ThreadFilter,
) {
  const { Thread } = models();
  const { type, activityId, scope, name, limit = 25, offset = 0 } = filters;
  const where: any = { repositoryId };
  if (type) where.type = type;
  if (activityId) where.activityId = activityId;
  const predicates: WhereOptions[] = [];
  // all, mentions, mine, unread...
  const scopePredicate = scope && SCOPE_PREDICATE[scope];
  if (scopePredicate) predicates.push(scopePredicate(userId));
  if (name) predicates.push(matchName(name));
  if (predicates.length) where[Op.and] = predicates;
  const { rows, count } = await Thread.findAndCountAll({
    where,
    ...threadQuery(userId),
    order: [
      [IS_STARRED, 'DESC'],
      [col('thread.last_message_at'), 'DESC NULLS LAST'],
    ],
    limit,
    offset,
    distinct: true,
    subQuery: false,
  });
  return { items: rows.map(toReaderThread), total: count };
}

/**
 * Merges the thread and user-thread state into a single entity.
 */
function toReaderThread(row: Thread) {
  const { reader, isUnread, ...thread } = row.toJSON() as any;
  return {
    ...thread,
    isUnread: !!isUnread,
    lastReadAt: reader?.lastReadAt ?? null,
    isStarred: reader?.isStarred ?? false,
  };
}

/**
 * One thread as a reader sees it; the thread entry
 * with its anchors plus their star, watermark and unread flag. No
 * messages; those are `listMessages`.
 */
export async function getReaderThread(thread: Thread, userId: number) {
  const { Thread } = models();
  const row = await Thread.findByPk(thread.id, threadQuery(userId));
  return toReaderThread(row);
}

/**
 * A thread's messages, oldest first.
 */
export async function listMessages(
  thread: Thread,
  filters: MessageFilter = {},
) {
  const { Comment } = models();
  const { before, limit = 50 } = filters;
  const NO_REPLIES = { replyCount: 0, lastReplyAt: null, replyAuthorIds: [] };
  // Replies live under their parent, unless the author also sent one
  // to the thread itself.
  const where: any = {
    threadId: thread.id,
    [Op.or]: [{ parentId: null }, { isBroadcast: true }],
  };
  if (before) where.id = { [Op.lt]: before };
  const rows = await Comment.findAll({
    where,
    include: commentService.messageIncludes(),
    order: [['createdAt', 'DESC']],
    limit,
    paranoid: false,
  });
  const messages = rows.reverse();
  const summaries = await replySummaries(messages.map((it: any) => it.id));
  return messages.map((message: any) => ({
    ...message.toJSON(),
    ...(summaries.get(message.id) ?? NO_REPLIES),
  }));
}

/**
 * The replies footer for each message on the page: how many replies
 * hang under it, when the last one landed and who wrote them.
 */
async function replySummaries(messageIds: number[]) {
  if (!messageIds.length) return new Map<number, any>();
  const { Comment } = models();
  const rows = await Comment.findAll({
    where: { parentId: messageIds },
    attributes: [
      'parentId',
      [lit('COUNT(*)::int'), 'replyCount'],
      [lit('MAX(created_at)'), 'lastReplyAt'],
      [lit(AUTHOR_IDS_SQL), 'replyAuthorIds'],
    ],
    group: ['parent_id'],
    raw: true,
  });
  return new Map<number, any>(
    rows.map(({ parentId, ...summary }: any) => [parentId, summary]),
  );
}

/**
 * Moves a reader's watermark on a thread forward.
 * Raw SQL so the watermark can only move forward: two writes can land
 * out of order, and `GREATEST` keeps the later time whichever arrives
 * last.
 */
export async function advanceWatermark(
  threadId: number,
  userId: number,
  seenAt: Date,
) {
  // `EXCLUDED` is Postgres' name for the row we tried to insert, so
  // `EXCLUDED.last_read_at` -> `seenAt`
  await orm().query(
    `
    INSERT INTO comment_user_thread
      (thread_id, user_id, last_read_at, created_at, updated_at)
    VALUES (:threadId, :userId, :seenAt, NOW(), NOW())
    ON CONFLICT (thread_id, user_id) DO UPDATE
      SET last_read_at =
            GREATEST(comment_user_thread.last_read_at, EXCLUDED.last_read_at),
          updated_at = NOW()
    `,
    { replacements: { threadId, userId, seenAt } },
  );
}

/**
 * Count unread threads for a given repository and user.
 */
function countUnreadThreads(repositoryId: number, userId: number) {
  const { Thread } = models();
  return Thread.count({
    where: { repositoryId, ...UNREAD_WHERE },
    include: [readerInclude(userId)],
  });
}

/**
 * Marks a thread read for one reader and clears their mentions in it.
 */
export async function markRead(thread: Thread, userId: number) {
  const threadId = thread.id;
  const lastReadAt = new Date();
  await advanceWatermark(threadId, userId, lastReadAt);
  await clearMentions(userId, { threadId });
  logger.debug({ threadId, userId }, 'Thread marked read');
  return { threadId, lastReadAt: lastReadAt.toISOString() };
}

/**
 * Marks every thread in the repository read for one reader and clears
 * all their mentions there.
 */
export async function markAllRead(repositoryId: number, userId: number) {
  const { Thread, UserThread } = models();
  const lastReadAt = new Date();
  const threads = await Thread.findAll({
    where: { repositoryId },
    attributes: ['id'],
    raw: true,
  });
  await UserThread.bulkCreate(
    threads.map(({ id }: any) => ({ threadId: id, userId, lastReadAt })),
    { updateOnDuplicate: ['lastReadAt', 'updatedAt'] },
  );
  await clearMentions(userId, { repositoryId });
  return unreadSummary(repositoryId, userId);
}

/**
 * Unseen badge counts: threads holding unseen messages, and unread mentions.
 */
export async function unreadSummary(repositoryId: number, userId: number) {
  const [threads, mentions] = await Promise.all([
    countUnreadThreads(repositoryId, userId),
    countUnreadMentions(userId, { repositoryId }),
  ]);
  return { threads, mentions };
}

/**
 * Stars or unstars a thread for one reader.
 */
export async function setStarred(
  thread: Thread,
  userId: number,
  isStarred: boolean,
) {
  const { UserThread } = models();
  const threadId = thread.id;
  const [state] = await UserThread.findOrCreate({
    where: { threadId, userId },
    defaults: { isStarred },
  });
  if (state.isStarred !== isStarred) await state.update({ isStarred });
  logger.debug({ threadId, userId, isStarred }, 'Thread star updated');
  return getReaderThread(thread, userId);
}

/**
 * Resolves or reopens a whole anchored thread.
 */
export async function setResolved(thread: Thread, isResolved: boolean) {
  const { Comment } = models();
  const threadId = thread.id;
  if (!isAnchored(thread)) throw new ThreadNotResolvableError();
  await Comment.update(
    { resolvedAt: isResolved ? new Date() : null },
    { where: { threadId }, paranoid: false },
  );
  logger.debug({ threadId, isResolved }, 'Thread resolution updated');
}

/**
 * Deletes a free-standing thread. An anchored thread's
 * messages are the comments the editor shows on that
 * content; they cannot be deleted.
 */
export async function removeThread(thread: Thread, user: User) {
  const { Comment } = models();
  const { id: threadId, repositoryId } = thread;
  if (isAnchored(thread)) throw new ThreadNotDeletableError();
  const opening = await Comment.findOne({
    where: { threadId },
    order: [['id', 'ASC']],
    paranoid: false,
  });
  const isAuthor = opening?.authorId === user.id;
  if (!isAuthor && !user.isAdmin()) throw new ThreadForbiddenError();
  // Deleted one by one so each message's delete hook runs
  await Comment.destroy({
    where: { threadId },
    individualHooks: true,
  });
  const payload = thread.toJSON();
  await thread.destroy();
  sse.channel(repositoryId).send(Events.Delete, payload);
  logger.info({ threadId, userId: user.id }, 'Thread deleted');
  return { id: threadId };
}
