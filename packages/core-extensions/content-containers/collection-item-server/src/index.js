import { map } from 'lodash-es';

const ATTRS = [
  'id',
  'uid',
  'type',
  'position',
  'parentId',
  'createdAt',
  'updatedAt',
];

function fetch(parent, type) {
  return parent
    .getChildren({ attributes: ATTRS, where: { type } })
    .map((it) => it.toJSON());
}

/**
 * Resolve function to process static assets in collection item data
 * @param {Object} container - The container with data
 * @param {Function} resolveStatics - Resolves content elements and meta values
 * @returns {Promise<Object>} Container with resolved assets
 */
async function resolve(container, resolveStatics) {
  if (container.data) await Promise.all(map(container.data, resolveStatics));
  return container;
}

export default {
  templateId: 'COLLECTION_ITEM_CONTENT',
  version: '1.0',
  fetch,
  resolve,
};
