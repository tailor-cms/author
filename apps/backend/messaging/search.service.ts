// Message search
import type {
  AssetsFilter,
  SearchFilter,
  ThreadAsset,
} from './schemas/index.ts';
import { col, fn, Op, where } from 'sequelize';
import { extractReferences, ReferenceType } from '@tailor-cms/utils';
import { createLogger } from '#logger';
import * as commentService from './comment.service.ts';
import db from '#shared/database/index.js';

const models = () => db as any;

const logger = createLogger('messaging:search');

interface AssetSearchRow {
  content: string;
  threadId: number | null;
  createdAt: Date;
}

/**
 * Full-text match; `search_vector` holds each message
 * pre-digested (words stemmed, stop words dropped), `websearch_to_tsquery`
 * turns what the user typed into that query with search-engine syntax.
 */
const textPredicate = (q: string) =>
  where(
    col('comment.search_vector'),
    Op.match,
    fn('websearch_to_tsquery', 'english', q),
  );

// Narrows to messages mentioning any of the users
const mentionInclude = (userIds: number[]) => ({
  model: models().Mention,
  as: 'mentions',
  attributes: [],
  where: { userId: userIds },
  required: true,
});

// A reference is stored as `<#type:id|label>`
const referencePredicate = (reference: string) => ({
  content: { [Op.like]: `%<#${reference}|%` },
});

// The thread a hit belongs to, so a result can be labelled and opened.
const threadInclude = () => {
  const { Activity, ContentElement, Thread } = models();
  return {
    model: Thread,
    as: 'thread',
    attributes: ['id', 'title', 'type', 'activityId', 'contentElementId'],
    paranoid: false,
    include: [
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
    ],
  };
};

/**
 * Messages matching the filters, newest first.
 */
export async function searchMessages(
  repositoryId: number,
  filters: SearchFilter,
) {
  const { Comment } = models();
  const { mentions, references, limit = 30, offset = 0 } = filters;
  const q = filters.q?.trim();
  const predicates: any[] = [];
  if (q) predicates.push(textPredicate(q));
  references?.forEach((it) => predicates.push(referencePredicate(it)));
  if (!predicates.length && !mentions?.length) return { items: [], total: 0 };
  const include = [...commentService.messageIncludes(), threadInclude()];
  if (mentions?.length) include.push(mentionInclude(mentions));
  const { rows, count } = await Comment.findAndCountAll({
    where: { repositoryId, [Op.and]: predicates },
    include,
    order: [['createdAt', 'DESC']],
    limit,
    offset,
    distinct: true,
  });
  logger.debug({ repositoryId, total: count }, 'Searched messages');
  return { items: rows, total: count };
}

/**
 * One entry per asset in the order it was last shared.
 */
const groupByAsset = (messages: AssetSearchRow[]): ThreadAsset[] => {
  const assets = new Map<string, ThreadAsset>();
  messages.forEach(({ content, threadId, createdAt }) => {
    const ids = extractReferences(content)
      .filter((it) => it.entityType === ReferenceType.Asset)
      .map((it) => it.entityId);
    new Set(ids).forEach((entityId) => {
      const asset = assets.get(entityId);
      if (asset) {
        asset.shareCount += 1;
        return;
      }
      const lastSharedAt = createdAt.toISOString();
      assets.set(entityId, { entityId, threadId, lastSharedAt, shareCount: 1 });
    });
  });
  return [...assets.values()];
};

/**
 * Every asset shared in the repository's threads, most recently shared
 * first. A shared file is a `<#asset:id|label>` token in the text.
 */
export async function listAssets(
  repositoryId: number,
  filters: AssetsFilter = {},
) {
  const { Comment } = models();
  const { threadId, limit = 50, offset = 0 } = filters;
  const messages: AssetSearchRow[] = await Comment.findAll({
    attributes: ['content', 'threadId', 'createdAt'],
    where: {
      repositoryId,
      ...(threadId && { threadId }),
      content: { [Op.like]: `%<#${ReferenceType.Asset}:%` },
    },
    order: [['createdAt', 'DESC']],
    raw: true,
  });
  const assets = groupByAsset(messages);
  return { items: assets.slice(offset, offset + limit), total: assets.length };
}
