import { StatusCodes } from 'http-status-codes';
import find from 'lodash/find.js';
import get from 'lodash/get.js';
import { Op } from 'sequelize';
import pick from 'lodash/pick.js';
import { schema } from '@tailor-cms/config';
import { createLogger } from '../shared/logger.js';
import db from '../shared/database/index.js';
import { fetchActivityContent } from '../shared/publishing/helpers.js';
import { createError } from '../shared/error/helpers.js';
import oauth2 from '../shared/oAuth2Provider.js';
import publishingService from '../shared/publishing/publishing.service.js';
import consumerConfig from '#config/consumer.js';

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

function patch({ repository, user, activity, body }, res) {
  const context = { userId: user.id, repository };
  return activity.update(body, { context }).then((data) => res.json({ data }));
}

async function remove({ user, repository, activity }, res) {
  const context = { userId: user.id, repository };
  const options = { recursive: false, soft: true, context };
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

function publish({ activity }, res) {
  log(`[publish] initiated, activityId: ${activity.id}`);
  if (activity.detached) {
    return createError(
      StatusCodes.METHOD_NOT_ALLOWED,
      'Cannot publish a deleted activity',
    );
  }
  return publishingService
    .publishActivity(activity)
    .then((data) => res.json({ data }));
}

function clone({ activity, body, user }, res) {
  const { repositoryId, parentId, position } = body;
  const context = { userId: user.id };
  return activity
    .clone(repositoryId, parentId, position, context)
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

async function updateStatus({ user, body, activity }, res) {
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
  updateStatus,
};
