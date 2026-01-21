import { StatusCodes } from 'http-status-codes';
import find from 'lodash/find.js';
import get from 'lodash/get.js';
import { Op } from 'sequelize';
import pick from 'lodash/pick.js';
import { schema } from '@tailor-cms/config';
import db from '#shared/database/index.js';
import { createError } from '#shared/error/helpers.js';
import { createLogger } from '#logger';
import { fetchActivityContent } from '#shared/publishing/actions.js';
import consumerConfig from '#config/consumer.js';
import linkService from '#shared/content-library/link.service.js';
import oauth2 from '#shared/oAuth2Provider.js';
import publishingService from '#shared/publishing/publishing.service.js';

const { Activity, sequelize } = db;
const { getOutlineLevels, isOutlineActivity } = schema;

const logger = createLogger('activity:controller');
const log = (msg) => logger.info(msg.replace(/\n/g, ' '));

function list({ repository, query, opts }, res) {
  if (!query.detached) opts.where.detached = false;
  if (query.outlineOnly) {
    // Include deleted if published and deletion is not published yet
    opts.paranoid = false;
    opts.where.type = getOutlineLevels(repository.schema).map((it) => it.type);
    opts.where[Op.or] = [
      { deletedAt: null },
      {
        publishedAt: {
          [Op.ne]: null,
          [Op.lt]: sequelize.col('activity.deleted_at'),
        },
      },
    ];
  }
  return repository.getActivities(opts).then((data) => res.json({ data }));
}

function create({ user, repository, body }, res) {
  const outlineConfig = find(getOutlineLevels(repository.schema), {
    type: body.type,
  });
  const data = {
    ...pick(body, ['uid', 'type', 'parentId', 'position']),
    data: { ...get(outlineConfig, 'defaultMeta', {}), ...body.data },
    repositoryId: repository.id,
  };
  const context = { userId: user.id, repository };
  return Activity.create(data, { context }).then((data) => res.json({ data }));
}

function show({ activity }, res) {
  return res.json({ data: activity });
}

async function patch({ repository, user, activity, body }, res) {
  const context = { userId: user.id, repository };
  // If changing parent for outline item, update parent publishing status
  if (
    isOutlineActivity(activity.type) &&
    activity.parentId &&
    body.parentId &&
    body.parentId !== activity.parentId
  ) {
    const parent = await Activity.findByPk(activity.parentId);
    await parent.touch();
  }
  const data = await activity.update(body, { context });
  return res.json({ data });
}

async function remove({ user, repository, activity }, res) {
  const context = { userId: user.id, repository };
  const options = { recursive: true, soft: true, context };
  const deleted = await activity.remove(options);
  await updatePublishingStatus(repository, activity);
  return res.json({ data: pick(deleted, ['id']) });
}

function reorder({ activity, body, repository, user }, res) {
  const context = { userId: user.id, repository };
  return activity
    .reorder(body.position, context)
    .then((data) => res.json({ data }));
}

async function restore({ activity, repository, user }, res) {
  const context = { userId: user.id, repository };
  await activity.restoreWithDescendants({ context });
  return res.json({ data: activity });
}

async function publish({ activity }, res) {
  log(`[publish] initiated, activityId: ${activity.id}`);
  if (activity.detached) {
    return createError(
      StatusCodes.METHOD_NOT_ALLOWED,
      'Cannot publish a deleted activity',
    );
  }
  const data = await (activity.deletedAt
    ? publishingService.unpublishActivity(activity)
    : publishingService.publishActivity(activity));
  return res.json({ data });
}

async function clone({ activity, body, user }, res) {
  return activity
    .clone(body.repositoryId, body.parentId, body.position, { userId: user.id })
    .then((mappings) => {
      const opts = { where: { id: Object.values(mappings.activityId) } };
      return Activity.findAll(opts).then((data) => res.json({ data }));
    });
}

function getPreviewUrl({ activity }, res) {
  if (!consumerConfig.previewWebhookUrl || !oauth2.isConfigured)
    throw new Error('Preview is not configured!');
  return fetchActivityContent(activity, true)
    .then((content) => {
      const body = {
        ...pick(activity, ['id', 'uid', 'type']),
        repositoryId: activity.repositoryId,
        meta: activity.data,
        ...content,
      };
      return oauth2.send(consumerConfig.previewWebhookUrl, body);
    })
    .then(({ data: { url } }) => {
      return res.json({
        location: `${new URL(url, consumerConfig.previewWebhookUrl)}`,
      });
    });
}

async function updateWorkflowStatus({ user, activity, body }, res) {
  const context = { user };
  const data = pick(body, [
    'assigneeId',
    'status',
    'priority',
    'description',
    'dueDate',
  ]);
  const status = await activity.createStatus(data, { context });
  await status.reload();
  return res.json({ data: status });
}

function updatePublishingStatus(repository, activity) {
  if (!isOutlineActivity(activity.type)) return Promise.resolve();
  return publishingService.updatePublishingStatus(repository);
}

/**
 * Link activity from another repository into this repository.
 * Creates a linked copy that receives auto-sync updates from source.
 * User must have access to both source and target repositories.
 *
 * For same-schema linking: type stays the same, validates against subLevels.
 * For cross-schema linking: type transforms based on compatibleTypes config.
 */
async function link({ repository, user, body }, res) {
  const { sourceId, parentId, position } = body;
  const context = { userId: user.id, repository };
  const linked = await linkService.linkActivity(
    sourceId,
    repository,
    parentId,
    position,
    context,
  );
  return res.json({ data: linked });
}

/**
 * Unlink activity from source.
 * Converts linked copy to independent local copy. Keeps sourceId for provenance
 * tracking but clears isLinkedCopy flag to stop receiving auto-sync updates.
 * For hierarchical links, also unlinks all descendant activities and elements.
 */
async function unlink({ activity, user, repository }, res) {
  const context = { userId: user.id, repository };
  const unlinked = await linkService.unlinkActivity(activity.id, context);
  return res.json({ data: unlinked });
}

/**
 * Get locations where this source activity is being used.
 */
async function getCopies({ activity }, res) {
  const copies = await activity.findCopyLocations();
  return res.json({
    data: {
      totalCount: copies.length,
      copies,
    },
  });
}

/**
 * Get source activity info for a linked copy.
 */
async function getSource({ activity }, res) {
  if (!activity.sourceId) return res.json({ data: null });
  const source = await Activity.findByPk(activity.sourceId, {
    include: ['repository'],
  });
  if (!source) return res.json({ data: null });
  return res.json({
    data: {
      id: source.id,
      repository: source.repository,
    },
  });
}

export default {
  create,
  show,
  list,
  patch,
  remove,
  restore,
  reorder,
  clone,
  publish,
  getPreviewUrl,
  updateWorkflowStatus,
  link,
  unlink,
  getCopies,
  getSource,
};
