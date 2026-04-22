// Cross-cutting helpers shared across tool domains.
// Domain-specific helpers live in their own slice:
//   activity/helpers.ts
//   content-elements/helpers.ts
export {
  logger,
  dbContext,
  recordOperation,
  toolError,
} from './common.ts';

// Schema-driven lookups (config domain, used by both slices)
export {
  containerTypesForActivity,
  describeContainerSchema,
  getSchema,
  metaInputsForActivity,
  getAllowedElementTypes,
  resolveLabel,
  resolveOutlineType,
  stripSchemaPrefix,
  getContainerActivityMeta,
  subcontainerTypesForContainer,
} from './schema.ts';

// Meta input defaults
export { defaultForMeta, mergeMetaDefaults } from './meta.ts';
