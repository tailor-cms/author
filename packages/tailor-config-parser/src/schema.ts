import type {
  ActivityRelationship,
  ContentContainer,
  ContentElementCategory,
  ContentElementItem,
  ElementConfig,
  Metadata,
  Schema,
} from '@tailor-cms/interfaces/schema';
import type { Activity } from '@tailor-cms/interfaces/activity';
import castArray from 'lodash/castArray.js';
import type { ContentElement } from '@tailor-cms/interfaces/content-element';
import filter from 'lodash/filter.js';
import find from 'lodash/find.js';
import first from 'lodash/first.js';
import flatMap from 'lodash/flatMap.js';
import get from 'lodash/get.js';
import isString from 'lodash/isString.js';
import map from 'lodash/map.js';
import reduce from 'lodash/reduce.js';
import type { Repository } from '@tailor-cms/interfaces/repository';
import sortBy from 'lodash/sortBy.js';
import union from 'lodash/union.js';
import uniq from 'lodash/uniq.js';

const DEFAULT_EMBED_ELEMENTS = ['CE_HTML_DEFAULT', 'CE_IMAGE', 'CE_EMBED'];

export const getSchemaApi = (schemas: Schema[], ceRegistry: string[]) => {
  return {
    getSchemaId,
    getSchema,
    getLevel: getActivityConfig,
    getOutlineLevels,
    isOutlineActivity,
    getOutlineChildren,
    filterOutlineActivities,
    isTrackedInWorkflow,
    getRepositoryMetadata,
    getActivityLabel,
    getActivityMetadata,
    getElementMetadata,
    getLevelRelationships,
    getRepositoryRelationships,
    getSiblingTypes,
    getSupportedContainers,
    getContainerTemplateId,
    isEditable: (activityType: string) => {
      const config = getActivityConfig(activityType);
      const hasContainers = !!getSupportedContainers(activityType).length;
      return hasContainers || config.hasAssessments;
    },
  };

  function getSchemaId(type: string) {
    return type.includes('/') && first(type.split('/'));
  }

  function getSchema(id: string): Schema {
    const schema = find(schemas, { id });
    if (!schema) throw new Error('Schema does not exist!');
    return schema;
  }

  function getOutlineLevels(schemaId: string) {
    return getSchema(schemaId).structure;
  }

  function isOutlineActivity(type: string) {
    const schema = getSchemaId(type);
    if (!schema) return false;
    return !!find(getOutlineLevels(schema), { type });
  }

  function isTrackedInWorkflow(type: string) {
    const schema = getSchemaId(type);
    if (!schema) return false;
    const activity = find(getOutlineLevels(schema), { type });
    return activity && activity.isTrackedInWorkflow;
  }

  function getActivityLabel(activity: Activity) {
    return getActivityConfig(activity.type).label;
  }

  function getActivityMetadata(activity: Activity) {
    if (!activity?.type) return [];
    const schemaId = getSchemaId(activity.type);
    return getMetadata(schemaId, activity, 'meta', 'data');
  }

  function getElementMetadata(schemaId: string, element: ContentElement) {
    if (!schemaId || !element) return { isEmpty: true };
    const inputs = getElementInputs(schemaId, element);
    const relationships = getElementRelationships(schemaId, element);
    return {
      isEmpty: !inputs.length && !relationships.length,
      inputs,
      relationships,
    };
  }

  function getElementInputs(schemaId: string, element: ContentElement) {
    if (!schemaId || !element) return [];
    return getMetadata(schemaId, element, 'inputs', 'meta');
  }

  function getElementRelationships(schemaId: string, element: ContentElement) {
    if (!schemaId || !element) return [];
    return getMetadata(schemaId, element, 'relationships', 'refs');
  }

  function getMetadata(
    schemaId: string,
    item: ContentElement | Activity,
    configKey = 'meta',
    storageKey = configKey,
  ) {
    const config = getConfig(schemaId, item);
    if (!config[configKey]) return [];
    return map(config[configKey], (it) => {
      const value = get(item, `${storageKey}.${it.key}`);
      return { ...it, value };
    });
  }

  // Get activity or content element config
  function getConfig(schemaId: string, item: Activity | ContentElement) {
    if (!schemaId || !item.type) return {};
    const hasActivityId = 'activityId' in item;
    const isElement = hasActivityId || isString(item.id);
    return isElement
      ? getElementConfig(schemaId, item.type)
      : getActivityConfig(item.type);
  }

  function getActivityConfig(type: string) {
    const schemaId = getSchemaId(type);
    return schemaId ? find(getOutlineLevels(schemaId), { type }) : {};
  }

  function getOutlineChildren(activities: Activity[], parentId: number) {
    const children = sortBy(filter(activities, { parentId }), 'position');
    if (!parentId || !children.length) return children;
    const parentType = find(activities, { id: parentId }).type;
    const types = getActivityConfig(parentType).subLevels;
    return filter(children, (it) => types.includes(it.type));
  }

  function filterOutlineActivities(activities: Activity[]) {
    return filter(activities, (it) => isOutlineActivity(it.type));
  }

  function getElementConfig(schemaId: string, type: string) {
    if (!schemaId) return {};
    // tesMeta used to support legacy config
    const { elementMeta, tesMeta } = getSchema(schemaId);
    if (!elementMeta && !tesMeta) return {};
    const config =
      elementMeta || map(tesMeta, (it) => ({ ...it, inputs: it.meta }));
    return find(config, (it) => castArray(it.type).includes(type)) || {};
  }

  function getSiblingTypes(type: string): string[] {
    if (!isOutlineActivity(type)) return [type];
    const schemaId = getSchemaId(type);
    const outline = getOutlineLevels(schemaId);
    const activityConfig = getActivityConfig(type);
    const isRootLevel = activityConfig.rootLevel;
    return uniq(
      reduce(
        outline,
        (acc, it) => {
          if (isRootLevel && it.rootLevel) acc.push(it.type);
          if (!it.subLevels || !it.subLevels.includes(type)) return acc;
          return [...acc, ...it.subLevels];
        },
        [],
      ),
    );
  }

  function getSupportedContainers(type: string): ContentContainer[] {
    const schema = getSchema(getSchemaId(type));
    const schemaConfig = get(schema, 'contentContainers', []);
    const activityConfig = get(
      getActivityConfig(type),
      'contentContainers',
      [],
    );
    return map(activityConfig, (type) => {
      const {
        types,
        contentElementConfig = types || ceRegistry,
        embedElementConfig = DEFAULT_EMBED_ELEMENTS,
        ...container
      } = find(schemaConfig, { type }) || {};
      if (types) {
        console.warn(`
          Deprecation notice: 'types' prop in content container
          schema config has been replaced with 'contentElementConfig'
        `);
      }
      return {
        ...container,
        contentElementConfig: processElementConfig(contentElementConfig),
        embedElementConfig: processElementConfig(embedElementConfig),
      };
    });
  }

  // type is checked because of legacy support
  function getContainerTemplateId(container: ContentContainer) {
    return container.templateId || container.type;
  }

  function getRepositoryMetadata(repository: Repository): Metadata[] {
    const config = get(getSchema(repository.schema), 'meta', []);
    return map(config, (it) => {
      const value = get(repository, `data.${it.key}`);
      return { ...it, value };
    });
  }

  function getLevelRelationships(type: string): ActivityRelationship[] {
    return get(getActivityConfig(type), 'relationships', []);
  }

  function getRepositoryRelationships(schemaId: string) {
    const structure = getOutlineLevels(schemaId);
    return flatMap(structure, (it) => it.relationships).reduce(
      (acc, { type }) => union(acc, [type]),
      [],
    );
  }
};

const processElementConfig = (config: ElementConfig[]) => {
  const DEFAULT_GROUP = 'Content Elements';
  return config.reduce((acc, it) => {
    const isGroup = typeof it !== 'string' && 'items' in it;
    if (isGroup) {
      it.items = it.items.map(processItem);
      acc.push(it);
      return acc;
    }
    const index = acc.findIndex((it) => it.name === DEFAULT_GROUP);
    if (index >= 0) acc[index].items.push(processItem(it));
    else acc.push({ name: DEFAULT_GROUP, items: [processItem(it)] });
    return acc;
  }, [] as ContentElementCategory[]);
};

const processItem = (item: ContentElementItem | string) => {
  return typeof item === 'string' ? { id: item as string } : item;
};
