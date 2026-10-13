// Messages: posting, editing, reactions and resolution, plus the
// projection every thread surface renders a message from.
import type { Comment } from './models/comment.model.js';
import type { CreateInput, ListFilter, ResolveInput } from './schemas/index.ts';
import type { ListQueryOptions } from '#shared/request/action.ts';
import type { Repository } from '../repository/models/repository.model.js';
import type { Transaction } from 'sequelize';
import type { User } from '../user/models/user.model.js';
import { Comment as Events } from '@tailor-cms/common/src/sse.js';
import { CommentType } from '@tailor-cms/interfaces/comment.ts';
import { InvalidResolveSelectorError, ParentNotFoundError } from './errors.ts';
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
  const attrs = {
    repositoryId: repository.id,
    activityId: payload.activityId,
    contentElementId: payload.contentElementId,
    authorId: user.id,
    threadId: parent?.threadId ?? payload.threadId,
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
