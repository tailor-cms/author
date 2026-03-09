import pick from 'lodash/pick.js';
import { StatusCodes } from 'http-status-codes';
import db from '#shared/database/index.js';
import PluginRegistry from '#shared/content-plugins/index.js';

const { elementRegistry } = PluginRegistry;

const { Activity, ContentElement } = db;

function list({ query, opts }, res) {
  const { detached, ids } = query;
  if (!detached) opts.where = { detached: false };
  if (ids) {
    const where = { id: ids.map(Number) };
    opts.include = { model: Activity.unscoped(), attributes: [], where };
  }
  return ContentElement.fetch(opts).then((data) => res.json({ data }));
}

function show({ contentElement }, res) {
  return res.json({ data: contentElement });
}

async function create({ user, repository, body }, res) {
  const attr = ['uid', 'activityId', 'type', 'data', 'position', 'refs'];
  const data = { ...pick(body, attr), repositoryId: repository.id };
  const context = { userId: user.id, repository };
  const contentElement = await ContentElement.create(data, { context });
  return res.json({ data: contentElement });
}

async function patch({ repository, user, body, contentElement }, res) {
  const attrs = ['type', 'data', 'position', 'meta', 'refs', 'deletedAt'];
  const data = pick(body, attrs);
  const context = { userId: user.id, repository };
  if (contentElement.deletedAt) contentElement.setDataValue('deletedAt', null);
  await contentElement.update(data, { context });
  return res.json({ data: contentElement });
}

async function remove({ repository, user, contentElement }, res) {
  const context = { userId: user.id, repository };
  await contentElement.destroy({ context });
  return res.end();
}

async function reorder({ body, contentElement }, res) {
  await contentElement.reorder(body.position);
  return res.json({ data: contentElement });
}

async function call({ contentElement, user, repository, body, params }, res) {
  const { action } = params;
  const { type } = contentElement;
  const handler = elementRegistry.getCallMethod(type, action);
  if (!handler) {
    const error = `Action "${action}" not found for element type "${type}"`;
    return res.status(StatusCodes.NOT_FOUND).json({ error });
  }
  const context = { userId: user.id, repository };
  const result = await handler(contentElement, body, { context });
  return res.json({ data: result });
}

export default {
  list,
  show,
  create,
  patch,
  remove,
  reorder,
  call,
};
