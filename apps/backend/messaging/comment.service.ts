// Messages: posting, editing, reactions and resolution, plus the
// projection every thread surface renders a message from.
import type { Comment } from './models/comment.model.js';
import type { CreateInput, ListFilter, ResolveInput } from './schemas/index.ts';
import type { ListQueryOptions } from '#shared/request/action.ts';
import type { Repository } from '../repository/models/repository.model.js';
import type { Transaction } from 'sequelize';
import type { User } from '../user/models/user.model.js';

import {
  AnchorNotFoundError,
  InvalidResolveSelectorError,
  ParentNotFoundError,
  ThreadNotFoundError,
} from './errors.ts';
import { Comment as Events } from '@tailor-cms/common/src/sse.js';
import { CommentType } from '@tailor-cms/interfaces/comment.ts';
import { INTEGRATION_SUMMARY_ATTRS } from './schemas/entity.ts';
import { USER_SUMMARY_ATTRS } from '#app/user/schemas/entity.ts';
import { createLogger } from '#logger';
import db from '#shared/database/index.js';
import sse from '#shared/sse/index.js';

// Models are resolved lazily
const models = () => db as any;

const logger = createLogger('messaging:comment');

const includeAuthor = () => {
  const { User } = models();
  return { model: User, as: 'author', attributes: [...USER_SUMMARY_ATTRS] };
};

// The person whose action an integration announced
const includeActor = () => ({ ...includeAuthor(), as: 'actor' });

const includeElement = ({ paranoid = true } = {}) => {
  const { ContentElement } = models();
  return {
    model: ContentElement,
    as: 'contentElement',
    attributes: ['uid', 'type'],
    paranoid,
  };
};

const includeIntegration = () => {
  const { Integration } = models();
  return {
    model: Integration,
    as: 'integration',
    attributes: [...INTEGRATION_SUMMARY_ATTRS],
  };
};

const includeReactions = () => {
  const { CommentReaction } = models();
  return {
    model: CommentReaction,
    as: 'reactions',
    attributes: ['emoji', 'userId'],
    include: [{ ...includeAuthor(), as: 'user' }],
  };
};

// Editor's comment data
const commentIncludes = () => [
  includeAuthor(),
  includeElement(),
  includeReactions(),
];

// Thread section data
export const messageIncludes = () => [
  includeAuthor(),
  includeElement({ paranoid: false }),
  includeIntegration(),
  includeActor(),
  includeReactions(),
];

export async function list(
  repository: Repository,
  opts: ListQueryOptions,
  filters: ListFilter,
): Promise<Comment[]> {
  const { activityId, contentElementId } = filters;
  const where = {
    ...opts.where,
    ...(activityId && { activityId }),
    ...(contentElementId && { contentElementId }),
  };
  return repository.getComments({ ...opts, where, include: commentIncludes() });
}

export async function listReplies(repositoryId: number, parentId: number) {
  const { Comment } = models();
  return Comment.findAll({
    where: { repositoryId, parentId },
    include: messageIncludes(),
    order: [['createdAt', 'ASC']],
    paranoid: false,
  });
}

/**
 * Posts a comment by `user`.
 */
export async function create(
  repository: Repository,
  user: User,
  payload: CreateInput,
): Promise<Comment> {
  const { Comment, sequelize } = models();
  const parent = payload.parentId
    ? await rootOf(repository.id, payload.parentId)
    : null;
  if (!(await hasAnchorAccess(repository.id, payload))) {
    throw new AnchorNotFoundError();
  }
  // A reply lands in its parent's thread;
  // Other messages rely on the caller to specify a valid thread.
  const threadId = parent ? parent.threadId : payload.threadId;
  if (!parent && !(await isRepositoryThread(repository.id, threadId))) {
    throw new ThreadNotFoundError();
  }
  const attrs = {
    repositoryId: repository.id,
    activityId: payload.activityId,
    contentElementId: payload.contentElementId,
    authorId: user.id,
    threadId,
    parentId: parent?.id ?? null,
    // Only a reply can be broadcast
    isBroadcast: !!parent && !!payload.isBroadcast,
    content: payload.content,
  };
  logger.debug(
    {
      repositoryId: repository.id,
      activityId: payload.activityId,
      contentElementId: payload.contentElementId,
      authorId: user.id,
    },
    'Creating comment',
  );
  const comment = await sequelize.transaction((transaction: Transaction) =>
    Comment.create(attrs, { transaction }),
  );
  return comment.reload({ include: commentIncludes() });
}

/**
 * Whether the activity and element a comment is anchored to are the
 * repository's own.
 */
async function hasAnchorAccess(repositoryId: number, payload: CreateInput) {
  const { Activity, ContentElement } = models();
  const { activityId, contentElementId } = payload;
  const [hasActivity, hasElement] = await Promise.all([
    isInRepository(Activity, activityId, repositoryId),
    isInRepository(ContentElement, contentElementId, repositoryId),
  ]);
  return hasActivity && hasElement;
}

// Whether the thread belongs to the repository
const isRepositoryThread = (repositoryId: number, threadId?: number | null) =>
  isInRepository(models().Thread, threadId, repositoryId);

async function isInRepository(
  Model: any,
  id: number | null | undefined,
  repositoryId: number,
) {
  if (!id) return true;
  const count = await Model.unscoped().count({
    where: { id, repositoryId },
    paranoid: false,
  });
  return count > 0;
}

/**
 * The message a reply hangs off. Threads are one level deep, so
 * replying to a reply attaches to what that reply was answering.
 */
async function rootOf(repositoryId: number, messageId: number) {
  const { Comment } = models();
  const message = await Comment.findOne({
    where: { id: messageId, repositoryId },
  });
  if (!message) throw new ParentNotFoundError();
  if (!message.parentId) return message;
  return Comment.findByPk(message.parentId);
}

/**
 * A message posted by an integration.
 */
export async function createIntegrationMessage(params: {
  repositoryId: number;
  integrationId: number;
  threadId: number;
  actorId?: number | null;
  senderName?: string | null;
  senderEmoji?: string | null;
  content: string;
  attachments?: unknown[] | null;
}): Promise<Comment> {
  const { Comment, sequelize } = models();
  const attrs = {
    repositoryId: params.repositoryId,
    threadId: params.threadId,
    integrationId: params.integrationId,
    actorId: params.actorId ?? null,
    type: CommentType.Integration,
    senderName: params.senderName ?? null,
    senderEmoji: params.senderEmoji ?? null,
    content: params.content,
    attachments: params.attachments ?? null,
  };
  const comment = await sequelize.transaction((transaction: Transaction) =>
    Comment.create(attrs, { transaction }),
  );
  return comment.reload({ include: messageIncludes() });
}

export async function update(
  comment: Comment,
  content: string,
): Promise<Comment> {
  const { sequelize } = models();
  const attrs = { content, editedAt: new Date() } as any;
  await sequelize.transaction((transaction: Transaction) =>
    comment.update(attrs, { transaction }),
  );
  return comment.reload({ include: commentIncludes() });
}

export async function remove(comment: Comment): Promise<{ id: number }> {
  await comment.destroy();
  return { id: comment.id };
}

/**
 * Toggles the reader's reaction emoji on a comment.
 */
export async function toggleReaction(
  comment: Comment,
  userId: number,
  emoji: string,
): Promise<Comment> {
  const { CommentReaction } = models();
  const [row, isAdded] = await CommentReaction.findOrCreate({
    where: { commentId: comment.id, userId, emoji },
  });
  if (!isAdded) await row.destroy();
  await comment.reload({ include: commentIncludes() });
  sse.channel(comment.repositoryId).send(Events.Update, comment);
  return comment;
}

/**
 * Resolves or reopens anchored thread comments.
 */
export async function setResolved(
  repository: Repository,
  payload: ResolveInput,
): Promise<void> {
  const { Comment } = models();
  const { id, contentElementId } = payload;
  if (!id && !contentElementId) throw new InvalidResolveSelectorError();
  const repositoryId = repository.id;
  const where = id
    ? { id, repositoryId }
    : await elementThreadPredicate(repositoryId, contentElementId as number);
  if (!where) return;
  const resolvedAt = payload.resolvedAt ? null : new Date();
  logger.debug(
    { repositoryId, id, contentElementId, isResolved: !!resolvedAt },
    'Updating comment resolution',
  );
  await Comment.update({ resolvedAt }, { where, paranoid: false });
}

async function elementThreadPredicate(
  repositoryId: number,
  contentElementId: number,
) {
  const { Thread } = models();
  const thread = await Thread.findOne({
    where: { repositoryId, contentElementId },
  });
  if (!thread) return null;
  return { threadId: thread.id, type: CommentType.User };
}
