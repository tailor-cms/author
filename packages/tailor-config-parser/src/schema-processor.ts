import type {
  ActivityConfig,
  ContentContainerConfig,
  Metadata,
  Schema,
} from '@tailor-cms/interfaces/schema';
import { find, isString, get, map, transform } from 'lodash-es';

import validate from './schema-validation';

interface ProcessOptions {
  // Registered scoring rubric ids; when provided, schema
  // `feedback.rubrics` references are validated against them
  rubricIds?: string[];
}

/**
 * Process and validate schema configurations.
 * Prefix activity types with schema id; SCHEMA_ID/TYPE.
 */
export default (schemas: Schema[] = [], options: ProcessOptions = {}) => {
  validate(schemas);
  schemas.forEach((schema) => {
    processRepositoryConfig(schema);
    schema.elementMeta?.forEach((it) => processelementMetaConfig(it));
    // Normalize activity types before processing configurations
    schema.structure.forEach((it) => {
      it.type = processType(schema, it.type);
    });
    schema.structure.forEach((it) => processActivityConfig(schema, it));
    if (schema.collection) {
      schema.contentContainers.forEach((it) => processCollectionConfig(it));
    }
  });
  // Second pass: validate and resolve cross-references (needs all schemas)
  processMapsTo(schemas);
  if (options.rubricIds) validateRubricRefs(schemas, options.rubricIds);
  return schemas;
};

function processRepositoryConfig(schema: Schema) {
  schema.meta = schema.meta || [];
  normalizeFileMeta(schema.meta);
  schema.defaultMeta = getMetaDefaults(schema.meta);
}

function processActivityConfig(schema: Schema, activity: ActivityConfig) {
  activity.subLevels = map(activity.subLevels, (type) =>
    processType(schema, type),
  );
  activity.parentTypes = resolveParentTypes(schema, activity);
  activity.relationships = processActivityRelationships(schema, activity);
  activity.meta = activity.meta || [];
  normalizeFileMeta(activity.meta);
  const hasNameMeta = find(activity.meta, { key: 'name' });
  if (!hasNameMeta) {
    activity.meta.unshift(buildNameMeta(schema, activity));
  }
  activity.defaultMeta = getMetaDefaults(activity.meta);
  // Legacy support, remove after migrating exam container
  const examObjectives = get(activity, 'exams.objectives');
  if (examObjectives) {
    activity.exams.objectives = map(examObjectives, (it) =>
      processType(schema, it),
    );
  }
}

function resolveParentTypes(schema: Schema, activityConfig: ActivityConfig) {
  return schema.structure
    .filter((it) => it.subLevels?.includes(activityConfig.type))
    .map((it) => it.type);
}

function processCollectionConfig(container: ContentContainerConfig) {
  // A slot flagged `isTitle` becomes the entry activity's `name` meta (see
  // buildNameMeta); drop it here so it isn't also rendered as a content slot.
  const config = ((container.config ?? []) as any[]).filter((it) => !it.isTitle);
  container.config = config;
  const inputs = config.filter((it: any) => it.IsInput) as Metadata[];
  normalizeFileMeta(inputs);
}

/**
 * Build the entry activity's `name` meta. For a collection whose item type
 * flags one of its slots `isTitle`, that slot defines the title - so the record
 * itself defines its title, edited like any other activity metadata (creation
 * dialog + editor details panel). Otherwise falls back to a generic Name.
 */
function buildNameMeta(schema: Schema, activity: ActivityConfig): Metadata {
  const titleProp = schema.collection ? findTitleProp(schema, activity) : null;
  if (titleProp) {
    return {
      key: 'name',
      type: titleProp.type,
      label: titleProp.label,
      ...(titleProp.placeholder && { placeholder: titleProp.placeholder }),
      validate: titleProp.validate ?? { required: true },
    };
  }
  return {
    key: 'name',
    type: 'TEXTAREA',
    label: 'Name',
    placeholder: 'Click to add...',
    validate: { required: true, min: 2, max: 250 },
  };
}

// Find title prop for collection entity.
// Each entity type is defined by an activity's content container.
// Each entity type can specify one title.
function findTitleProp(schema: Schema, activity: ActivityConfig): any {
  for (const type of activity.contentContainers ?? []) {
    const container = find(schema.contentContainers, { type });
    const titleProp = ((container?.config ?? []) as any[]).find(
      (it) => it.isTitle,
    );
    if (titleProp) return titleProp;
  }
  return null;
}

function processelementMetaConfig(elementMeta: any) {
  elementMeta.relationships?.forEach((relationship) => {
    relationship.allowedElementConfig = map(
      relationship.allowedElementConfig,
      (item) => (isString(item) ? { id: item } : item),
    );
  });
}

function processType(schema: Schema, type: string) {
  return `${schema.id}/${type}`;
}

// Normalize FILE meta: ensure `allowedExtensions` is always a top-level array
// with dot-prefixed extensions (e.g. ['.jpg', '.png'])
function normalizeFileMeta(meta: Metadata[]) {
  meta.forEach((it) => {
    if (it.type !== 'FILE') return;
    const raw = it.allowedExtensions || it.ext || it.validate?.ext || [];
    it.allowedExtensions = raw.map((e: string) =>
      e.startsWith('.') ? e : `.${e}`,
    );
  });
}

function getMetaDefaults(meta: Metadata[]) {
  return transform(
    meta,
    (acc, it) => {
      if (it.defaultValue) acc[it.key] = it.defaultValue;
    },
    {},
  );
}

function processActivityRelationships(schema: Schema, activity: ActivityConfig) {
  const { hasPrerequisites, relationships = [] } = activity;
  if (hasPrerequisites && !find(relationships, { type: 'prerequisites' })) {
    relationships.unshift({
      type: 'prerequisites',
      label: 'Prerequisites',
      placeholder: 'Select prerequisites',
      multiple: true,
      searchable: true,
      allowEmpty: true,
      allowCircularLinks: false,
      allowInsideLineage: false,
    });
  }
  // Prefix allowedTypes with the schema id
  relationships.forEach((relationship) => {
    if (!relationship.allowedTypes) return;
    relationship.allowedTypes = relationship.allowedTypes.map((type) =>
      processType(schema, type),
    );
  });
  return relationships;
}

/**
 * Validate schema `feedback.rubrics` references against the registered
 * scoring rubric ids - a typo fails the boot, same as mapsTo.
 */
function validateRubricRefs(schemas: Schema[], rubricIds: string[]) {
  const known = new Set(rubricIds);
  for (const schema of schemas) {
    for (const id of schema.feedback?.rubrics ?? []) {
      if (!known.has(id)) {
        throw new Error(
          `Schema "${schema.id}": unknown scoring rubric "${id}"`,
        );
      }
    }
  }
}

/**
 * Validate and resolve mapsTo entries.
 * - Validates target schema exists
 * - Validates target type exists in target schema
 * - Resolves target type to full path (e.g., 'PAGE' → 'COURSE_SCHEMA/PAGE')
 */
function processMapsTo(schemas: Schema[]) {
  for (const schema of schemas) {
    for (const activity of schema.structure) {
      if (!activity.mapsTo) continue;
      for (const [targetSchemaId, mapping] of Object.entries(activity.mapsTo)) {
        // Validate target schema exists
        const targetSchema = schemas.find((s) => s.id === targetSchemaId);
        if (!targetSchema) {
          throw new Error(
            `Schema "${schema.id}": activity "${activity.type}" ` +
            `mapsTo unknown schema "${targetSchemaId}"`,
          );
        }
        // Resolve target type to full path
        const fullTargetType = processType(targetSchema, mapping.type);
        // Validate target type exists in target schema
        const targetTypeExists = targetSchema.structure.some(
          (config) => config.type === fullTargetType,
        );
        if (!targetTypeExists) {
          throw new Error(
            `Schema "${schema.id}": activity "${activity.type}" mapsTo ` +
            `unknown type "${mapping.type}" in schema "${targetSchemaId}"`,
          );
        }
        // Resolve type to full path
        mapping.type = fullTargetType;
      }
    }
  }
}
