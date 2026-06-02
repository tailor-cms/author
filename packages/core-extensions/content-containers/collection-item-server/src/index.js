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

/**
 * COLLECTION_ITEM_CONTENT is a flat container whose content
 * is embedded INSIDE container.data, keyed by prop name -
 * there are no ContentElement rows, the container itself
 * carries the content. Each slot is either a meta input or
 * an embedded content element of a fixed type. Slots are
 * defined via the TailorCollection decorators (@IsInput,
 * @IsContentElement) and surfaced through container.config.
 * Returns subcontainers/elementConfig empty so consumers
 * routing on those shapes correctly skip this template as
 * "not addressable as a flat element host". The `slots`
 * field surfaces the actual structure for consumers that
 * know how to fill named, typed slots.
 */
function describeSchema(container) {
  const config = container?.config || {};
  const slots = Object.values(config).map((slot) => ({
    key: slot.key,
    label: slot.label,
    type: slot.type,
    isContentElement: !!slot.isContentElement,
    ...(slot.isGradable !== undefined && { isGradable: slot.isGradable }),
    ...(slot.defaultValue !== undefined && { defaultValue: slot.defaultValue }),
    ...(slot.required !== undefined && { required: slot.required }),
  }));
  return {
    elementConfig: null,
    subcontainers: [],
    slots,
  };
}

export default {
  templateId: 'COLLECTION_ITEM_CONTENT',
  version: '1.0',
  fetch,
  resolve,
  describeSchema,
};
