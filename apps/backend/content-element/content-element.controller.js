import pick from 'lodash/pick.js';
import db from '#shared/database/index.js';

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
  const attr = [
    'uid',
    'activityId',
    'type',
    'data',
    'meta',
    'position',
    'refs',
    // Content library linking fields
    'isLinkedCopy',
    'sourceId',
    'sourceModifiedAt',
    'contentId',
  ];
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

/**
 * Link element from another repository into this repository.
 * Creates a linked copy that receives auto-sync updates from source.
 * User must have access to both source and target repositories.
 */
async function link({ user, repository, body }, res) {
  const { sourceId, activityId, position } = body;
  const source = await ContentElement.findByPk(sourceId);
  if (!source) {
    return res.status(404).json({ error: 'Source element not found' });
  }
  const context = { userId: user.id, repository };
  const linkedElement = await ContentElement.create(
    {
      type: source.type,
      data: source.data,
      meta: source.meta,
      refs: {},
      repositoryId: repository.id,
      activityId,
      position,
      isLinkedCopy: true,
      sourceId: source.id,
      sourceModifiedAt: source.updatedAt,
      contentId: source.contentId,
    },
    { context },
  );
  return res.json({ data: linkedElement });
}

/**
 * Unlink element from source (keeps sourceId for provenance)
 */
async function unlink({ user, repository, contentElement }, res) {
  const context = { userId: user.id, repository };
  await contentElement.update(
    {
      isLinkedCopy: false,
      sourceModifiedAt: null,
    },
    { context, hooks: false },
  );
  return res.json({ data: contentElement });
}

/**
 * Get source info for a linked copy element.
 */
async function getSource({ contentElement }, res) {
  const sourceInfo = await contentElement.getSourceInfo();
  return res.json({ data: sourceInfo });
}

/**
 * Get locations where this source element is being used.
 */
async function getCopies({ contentElement }, res) {
  const usages = await contentElement.findCopyLocations();
  return res.json({
    data: {
      totalCount: usages.length,
      usages,
    },
  });
}

export default {
  list,
  show,
  create,
  patch,
  remove,
  reorder,
  link,
  unlink,
  getSource,
  getCopies,
};
