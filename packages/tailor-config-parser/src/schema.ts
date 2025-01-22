import type {
  ActivityConfig,
  ActivityRelationship,
  ContentContainerConfig,
  ContentElementCategory,
  ContentElementItem,
  ElementConfig,
  ElementMetaConfig,
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

const DEFAULT_GROUP = 'Content Elements';
const DEFAULT_EMBED_ELEMENTS = ['HTML', 'IMAGE', 'EMBED'];

type EmptyObject = Record<string, never>;

const processElementConfig = (config: ElementConfig[]) => {
  const processItem = (item: ContentElementItem | string, config?: any) => {
    const processed = isString(item) ? { id: item } : item;
    return Object.assign(processed, config);
  };

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
      return !!getSupportedContainers(activityType).length;
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
    const schemaId = getSchemaId(type);
    if (!schemaId) return false;
    return !!find(getOutlineLevels(schemaId), { type });
  }

  function isTrackedInWorkflow(type: string) {
    const schemaId = getSchemaId(type);
    if (!schemaId) return false;
    const activity = find(getOutlineLevels(schemaId), { type });
    return !!(activity && activity.isTrackedInWorkflow);
  }

  function getActivityLabel(activity: Activity) {
    return getActivityConfig(activity.type).label;
  }

  function getActivityMetadata(activity: Activity) {
    if (!activity?.type) return [];
    const schemaId = getSchemaId(activity.type);
    if (!schemaId) return [];
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

  function getActivityConfig(type: string): ActivityConfig | EmptyObject {
    const schemaId = getSchemaId(type);
    if (!schemaId) return {};
    return find(getOutlineLevels(schemaId), { type }) ?? {};
  }

  function getOutlineChildren(activities: Activity[], parentId: number | null) {
    const children = sortBy(filter(activities, { parentId }), 'position');
    if (!parentId || !children.length) return children;
    const parent = find(activities, { id: parentId });
    if (!parent) return [];
    const types = getActivityConfig(parent.type).subLevels;
    return types ? filter(children, (it) => types.includes(it.type)) : [];
  }

  function filterOutlineActivities(activities: Activity[]) {
    return filter(activities, (it) => isOutlineActivity(it.type));
  }

  function getElementConfig(schemaId: string, type: string):
    ElementMetaConfig | EmptyObject {
    if (!schemaId) return {};
    // tesMeta used to support legacy config
    const { elementMeta, tesMeta } = getSchema(schemaId);
    if (!elementMeta && !tesMeta) return {};
    const config =
      elementMeta || map(tesMeta, (it) => ({ ...it, inputs: it.meta }));
    return find(config, (it) => castArray(it.type).includes(type)) ?? {};
  }

  function getSiblingTypes(type: string): string[] {
    if (!isOutlineActivity(type)) return [type];
    const schemaId = getSchemaId(type);
    if (!schemaId) return [type];
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
        [] as string[],
      ),
    );
  }

  function getSupportedContainers(type: string): ContentContainerConfig[] {
    const schemaId = getSchemaId(type);
    if (!schemaId) return [];
    const schema = getSchema(schemaId);
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
      } = find(schemaConfig, { type }) as ContentContainerConfig;
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
  function getContainerTemplateId(container: ContentContainerConfig) {
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
      (acc, rel) => rel ? union(acc, [rel.type]) : acc,
      [],
    );
  }
};
