import { map } from 'lodash-es';

const ATTRS = [
  'id',
  'uid',
  'type',
  'position',
  'parentId',
  'data',
  'createdAt',
  'updatedAt',
];

function fetch(parent, type) {
  return parent
    .getChildren({ attributes: ATTRS, where: { type } })
    .map((it) => it.toJSON());
}

/**
 * Resolve static assets (storage:// URLs) embedded in collection item slot
 * data, delegating each slot value to the shared statics resolver.
 */
async function resolve(container, resolveStatics) {
  if (container.data) await Promise.all(map(container.data, resolveStatics));
  return container;
}

/**
 * COLLECTION_ITEM_CONTENT carries its content embedded INSIDE
 * container.data, keyed by the configured prop names - no
 * ContentElement rows, the container itself IS the content.
 * Each prop is either a meta input or an embedded content
 * element of a fixed type, declared via TailorCollection's
 * @IsInput / @IsContentElement decorators and surfaced
 * through container.config.
 *
 * subcontainers/elementConfig stay empty. The `props`
 * field carries the actual structure for consumers that
 * know how to fill data by prop name.
 */
function describeSchema(container) {
  const config = container?.config || {};
  const props = Object.values(config).map((prop) => ({
    key: prop.key,
    label: prop.label,
    type: prop.type,
    isContentElement: !!prop.isContentElement,
    ...(prop.isGradable !== undefined && { isGradable: prop.isGradable }),
    ...(prop.defaultValue !== undefined && { defaultValue: prop.defaultValue }),
    ...(prop.required !== undefined && { required: prop.required }),
  }));
  return {
    elementConfig: null,
    subcontainers: [],
    props,
  };
}

export default {
  templateId: 'COLLECTION_ITEM_CONTENT',
  version: '1.0',
  fetch,
  resolve,
  describeSchema,
};
