import type {
  ActivityConfig,
  Metadata,
  Schema,
} from '@tailor-cms/interfaces/schema';
import find from 'lodash/find.js';
import isString from 'lodash/isString.js';
import get from 'lodash/get.js';
import map from 'lodash/map.js';
import transform from 'lodash/transform.js';

import validate from './schema-validation';

const LABEL_COLORS = [
  ['#F44336', '#E91E63'],
  ['#9C27B0', '#673AB7'],
  ['#3F51B5', '#2196F3'],
  ['#03A9F4', '#00BCD4'],
  ['#009688', '#4CAF50'],
  ['#FF9800', '#FF5722'],
];

/**
 * Process and validate schema configurations.
 * Prefix activity types with schema id; SCHEMA_ID/TYPE.
 */
export default (schemas: Schema[] = []) => {
  validate(schemas);
  schemas.forEach((schema) => {
    processRepositoryConfig(schema);
    schema.elementMeta?.forEach((it) => processelementMetaConfig(it));
    schema.structure.forEach((it) => processActivityConfig(schema, it));
  });
  return schemas;
};

function processRepositoryConfig(schema: Schema) {
  schema.meta = schema.meta || [];
  const hasColorMeta = find(schema.meta, { key: 'color' });
  if (!hasColorMeta) {
    schema.meta.push({
      type: 'COLOR',
      key: 'color',
      label: 'Label color',
      colors: LABEL_COLORS,
      hideOnCreate: true,
      validate: {},
    });
  }
  schema.defaultMeta = getMetaDefaults(schema.meta);
}

function processActivityConfig(schema: Schema, activity: ActivityConfig) {
  activity.type = processType(schema, activity.type);
  activity.subLevels = map(activity.subLevels, (type) =>
    processType(schema, type),
  );
  activity.relationships = processActivityRelationships(activity);
  activity.meta = activity.meta || [];
  const hasNameMeta = find(activity.meta, { key: 'name' });
  if (!hasNameMeta) {
    activity.meta.unshift({
      key: 'name',
      type: 'TEXTAREA',
      label: 'Name',
      placeholder: 'Click to add...',
      validate: { required: true, min: 2, max: 250 },
    });
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

function processelementMetaConfig(elementMeta: any) {
  elementMeta.relationships?.forEach((relationship) => {
    relationship.allowedElementConfig = map(
      relationship.allowedElementConfig,
      (item) => isString(item) ? { id: item } : item,
    );
  });
}

function processType(schema: Schema, type: string) {
  return `${schema.id}/${type}`;
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

function processActivityRelationships(activity: ActivityConfig) {
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
  return relationships;
}
