import type { Transaction } from 'sequelize';
import type { Comment } from './comment.model.js';
import type ActivityModel from '../../activity/models/activity.model.js';
import type ContentElementModel
  from '../../content-element/models/content-element.model.js';
import type RepositoryModel from '../../repository/models/repository.model.js';
import type ThreadModel from '../thread/models/thread.model.js';
import type UserModel from '../../user/models/user.model.js';

import {
  advanceWatermark,
  findOrCreateThread,
  touchThread,
} from '../thread/thread.service.ts';
import { addMentions, syncMentions } from '../mention.service.ts';
import { CommentType } from '@tailor-cms/interfaces/comment.ts';
import { Op } from 'sequelize';
import { afterCommit } from '#shared/database/helpers.js';
import { createLogger } from '#logger';
import { messageIncludes } from '../comment.service.ts';
import { schema } from '@tailor-cms/config';
import mail from '#shared/mail/index.js';
import sse from '#shared/sse/index.js';

type HookOpts = { fields?: string[]; transaction?: Transaction };
type MailAction = 'left' | 'updated';

interface ModelsBag {
  Activity: typeof ActivityModel;
  ContentElement: typeof ContentElementModel;
  Repository: typeof RepositoryModel;
  Thread: typeof ThreadModel;
  User: typeof UserModel;
}

const logger = createLogger('messaging:comment');

function add(Comment: any, Hooks: any, db: ModelsBag) {
  const { Events } = Comment;
  const { Activity, ContentElement, Repository, Thread, User } = db;

  const broadcast = (event: string, comment: Comment) =>
    sse.channel(comment.repositoryId).send(event, comment);

  const mailIncludes = [
    { model: User, as: 'author' },
    { model: Repository, attributes: ['id', 'name'] },
    { model: Thread, as: 'thread', attributes: ['title'] },
    { model: Activity, attributes: ['id', 'type', 'data'], paranoid: false },
    {
      model: ContentElement,
      as: 'contentElement',
      attributes: ['uid'],
      paranoid: false,
    },
  ];

  // Make sure the thread exists before the comment is created.
  Comment.addHook(Hooks.beforeCreate, async (comment: Comment) => {
    if (comment.threadId) return;
    const thread = await findOrCreateThread(comment);
    comment.threadId = thread.id;
  });

  Comment.addHook(
    Hooks.afterCreate,
    async (comment: Comment, opts: HookOpts) => {
      const mentionedIds = await addMentions(comment, opts);
      await afterCommit(opts.transaction, async () => {
        await comment.reload({ include: messageIncludes() });
        broadcast(Events.Create, comment);
        // Settled in `beforeCreate`
        const threadId = comment.threadId as number;
        await touchThread(threadId);
        await markSeenByWriter(comment, threadId);
        if (mentionedIds.length) notifyByMail(comment, mentionedIds, 'left');
      });
    },
  );

  Comment.addHook(
    Hooks.afterUpdate,
    async (comment: Comment, opts: HookOpts) => {
      const isEdited = !!opts.fields?.includes('content');
      const mentionedIds = isEdited ? await syncMentions(comment, opts) : [];
      await afterCommit(opts.transaction, () => {
        broadcast(Events.Update, comment);
        if (mentionedIds.length) {
          notifyByMail(comment, mentionedIds, 'updated');
        }
      });
    },
  );

  // Resolving can touch every message in a thread at once
  Comment.addHook(Hooks.afterBulkUpdate, async ({ where }: { where: any }) => {
    const comments: Comment[] = await Comment.findAll({
      where,
      paranoid: false,
    });
    comments.forEach((it) => broadcast(Events.Update, it));
    const threadIds = comments
      .map((it) => it.threadId)
      .filter((it) => it != null);
    await Promise.all([...new Set(threadIds)].map((id) => touchThread(id)));
  });

  Comment.addHook(Hooks.afterDestroy, async ({ id }: Comment) => {
    const comment = await Comment.findByPk(id, { paranoid: false });
    broadcast(Events.Delete, comment);
    if (comment.threadId) await touchThread(comment.threadId);
  });

  // actorId, representing the user who performed the action for
  // integration comments.
  async function markSeenByWriter(comment: Comment, threadId: number) {
    const writerId = comment.authorId ?? comment.actorId;
    if (!writerId) return;
    await advanceWatermark(threadId, writerId, new Date(comment.createdAt));
  }

  const notifyByMail = (
    comment: Comment,
    mentionedIds: number[],
    action: MailAction,
  ) =>
    sendEmailNotification(comment, mentionedIds, action).catch((error) => {
      logger.error({ error, commentId: comment.id }, 'Comment mail not sent');
    });

  /**
   * Mails the people a message names.
   */
  async function sendEmailNotification(
    comment: Comment,
    mentionedIds: number[],
    action: MailAction,
  ) {
    if (comment.type === CommentType.Integration) return;
    const message = await Comment.findByPk(comment.id, {
      include: mailIncludes,
    });
    // An edit can still land on a deleted message
    if (!message) return;
    const { author, repository, thread, activity, contentElement } = message;
    const mentioned = await User.findAll({ where: { id: mentionedIds } });
    const recipients = mentioned
      .map((it) => it.email)
      .filter((it) => it !== author.email);
    if (!recipients.length) return;
    // Context only helps with something new.
    const previous = action === 'left' ? await previousMessages(comment) : [];
    await mail.sendCommentNotification(recipients, {
      repositoryId: repository.id,
      repositoryName: repository.name,
      threadId: comment.threadId,
      activityId: comment.activityId,
      linkTarget: linkTargetLabel(activity),
      elementUid: contentElement?.uid,
      // What the thread is called: its subject, or its anchor's name.
      topic: thread?.title ?? activity?.data?.name ?? repository.name,
      author: author.profile,
      content: comment.content,
      action,
      previousComments: previous,
    });
  }

  // The messages right above this one where it landed: in the thread,
  // or under the message it replies to.
  async function previousMessages(comment: Comment) {
    const { threadId, parentId } = comment;
    const placement = parentId
      ? { [Op.or]: [{ id: parentId }, { parentId }] }
      : { [Op.or]: [{ parentId: null }, { isBroadcast: true }] };
    const messages = await Comment.findAll({
      where: {
        ...placement,
        threadId,
        type: CommentType.User,
        id: { [Op.lt]: comment.id },
      },
      limit: 3,
      order: [['createdAt', 'DESC']],
      include: [{ model: User, as: 'author' }],
    });
    return messages
      .filter((it: any) => it.author)
      .map((it: any) => ({
        author: { label: it.author.label },
        content: it.content,
      }));
  }
}

// What the mail's link opens, in the reader's words: the thread a
// free-standing message sits in, or the content a comment is on
function linkTargetLabel(activity: any): string {
  if (!activity) return 'thread';
  return schema.getLevel(activity.type)?.label ?? 'activity';
}

export default { add };
