// A mention is a `<@id|label>` token in the message body
import type { Transaction } from 'sequelize';
import type { Comment } from './models/comment.model.js';
import { createLogger } from '#logger';
import { extractMentions } from '@tailor-cms/utils';
import { Op } from 'sequelize';
import { subQuery } from '#shared/database/helpers.js';
import db from '#shared/database/index.js';

// Models are resolved lazily
const models = () => db as any;
const logger = createLogger('messages:mentions');

interface WriteOpts {
  transaction?: Transaction;
}

// Which messages: a whole repository, or one thread.
type MessageWhere = { repositoryId: number } | { threadId: number };

/**
 * `Mention` query options for the reader's unread mentions in messages
 * that still exist.
 */
const unreadMentions = (userId: number, where: MessageWhere) => {
  const { Comment } = models();
  const liveMessageIds = subQuery(Comment, {
    attributes: ['id'],
    where: { ...where, deletedAt: null },
  });
  return {
    where: { userId, readAt: null, commentId: { [Op.in]: liveMessageIds } },
  };
};

// How many mentions still await the reader.
export function countUnreadMentions(userId: number, where: MessageWhere) {
  const { Mention } = models();
  return Mention.count(unreadMentions(userId, where));
}

// Marks the reader's mentions read.
export function clearMentions(userId: number, where: MessageWhere) {
  const { Mention } = models();
  return Mention.update({ readAt: new Date() }, unreadMentions(userId, where));
}

// Records who a new message mentions and returns their ids.
export async function addMentions(
  message: Comment,
  { transaction }: WriteOpts = {},
): Promise<number[]> {
  const userIds = await mentionedMemberIds(message, transaction);
  await insertMentions(message.id, userIds, transaction);
  return userIds;
}

/**
 * Brings an edited message's mentions in line with its body.
 */
export async function syncMentions(
  message: Comment,
  { transaction }: WriteOpts = {},
): Promise<number[]> {
  const { Mention } = models();
  const userIds = await mentionedMemberIds(message, transaction);
  await Mention.destroy({
    where: { commentId: message.id, userId: { [Op.notIn]: userIds } },
    transaction,
  });
  await insertMentions(message.id, userIds, transaction);
  return userIds;
}

// Inserts mention rows for the given comment and user IDs.
async function insertMentions(
  commentId: number,
  userIds: number[],
  transaction?: Transaction,
) {
  if (!userIds.length) return;
  const { Mention } = models();
  await Mention.bulkCreate(
    userIds.map((userId) => ({ commentId, userId })),
    { ignoreDuplicates: true, transaction },
  );
  logger.debug({ commentId, mentions: userIds.length }, 'Mentions written');
}

// Who the message body names; narrowed to people who can reach the repository.
async function mentionedMemberIds(
  message: Comment,
  transaction?: Transaction,
) {
  const mentioned = extractMentions(message.getDataValue('content') ?? '');
  if (!mentioned.length) return [];
  const members = await repositoryMemberIds(message.repositoryId, transaction);
  return [
    ...new Set(mentioned.map((it) => it.userId).filter((id) => members.has(id))),
  ];
}

/**
 * Ids of everyone who can reach the repository, directly or through a
 * user group. A mention can never notify; or reveal anybody else.
 */
async function repositoryMemberIds(
  repositoryId: number,
  transaction?: Transaction,
) {
  const { RepositoryUser, RepositoryUserGroup, UserGroupMember } = models();
  const [users, groups] = await Promise.all([
    RepositoryUser.findAll({
      where: { repositoryId, hasAccess: true },
      attributes: ['userId'],
      raw: true,
      transaction,
    }),
    RepositoryUserGroup.findAll({
      where: { repositoryId },
      attributes: ['groupId'],
      raw: true,
      transaction,
    }),
  ]);
  const groupMembers = groups.length
    ? await UserGroupMember.findAll({
        where: { groupId: groups.map((it: any) => it.groupId) },
        attributes: ['userId'],
        raw: true,
        transaction,
      })
    : [];
  return new Set<number>(
    [...users, ...groupMembers].map((it: any) => Number(it.userId)),
  );
}
