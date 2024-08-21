import { createLogger } from '../logger.js';
import db from '../database/index.js';
import differenceWith from 'lodash/differenceWith.js';
import filter from 'lodash/filter.js';
import find from 'lodash/find.js';
import findIndex from 'lodash/findIndex.js';
import get from 'lodash/get.js';
import hash from 'hash-obj';
import hooks from '../../content-element/hooks.js';
import keys from 'lodash/keys.js';
import map from 'lodash/map.js';
import omit from 'lodash/omit.js';
import pick from 'lodash/pick.js';
import PluginRegistry from '../content-plugins/index.js';
import Promise from 'bluebird';
import reduce from 'lodash/reduce.js';
import { schema } from 'tailor-config-shared';
import storage from '../../repository/storage.js';
import without from 'lodash/without.js';

const { Activity, ContentElement, Sequelize, sequelize } = db;
const { containerRegistry } = PluginRegistry;
const { Op } = Sequelize;
const { getLevelRelationships, getOutlineLevels, getSupportedContainers } =
  schema;
const { FLAT_REPO_STRUCTURE } = process.env;

const logger = createLogger('publishing');
const log = (msg) => logger.debug(msg.replace(/\n/g, ' '));

const CC_ATTRS = ['id', 'uid', 'type', 'position', 'createdAt', 'updatedAt'];

function publishActivity(activity) {
  log(`[publishActivity] initiated, activity id: ${activity.id}`);
  return getStructureData(activity).then((data) => {
    const { repository, predecessors, spine } = data;
    const activityStructure = find(spine.structure, { id: activity.id });
    const prevPublishedContainers = get(
      activityStructure,
      'contentContainers',
      [],
    );

    predecessors.forEach((it) => {
      const exists = find(spine.structure, { id: it.id });
      if (!exists) addToSpine(spine, it);
    });

    activity.publishedAt = new Date();
    addToSpine(spine, activity);

    return publishContainers(activity)
      .then(async (containers) => {
        await unpublishDeletedContainers(
          activity,
          prevPublishedContainers,
          containers,
        );
        return containers;
      })
      .then((containers) => {
        const publishedData = find(spine.structure, { id: activity.id });
        return attachContainerSummary(publishedData, containers);
      })
      .then(() => saveSpine(spine))
      .then((savedSpine) =>
        updateRepositoryCatalog(repository, savedSpine.publishedAt, false),
      )
      .then(() => updatePublishingStatus(repository, activity))
      .then(() => activity.save())
      .then((activity) => {
        log(`[publishActivity] completed, activity id: ${activity.id}`);
        return activity;
      });
  });
}

function getRepositoryCatalog() {
  return storage.getFile('repository/index.json').then((buffer) => {
    if (!buffer) return [];
    return JSON.parse(buffer.toString('utf8'));
  });
}

function updateRepositoryCatalog(repository, publishedAt, updateInfo = true) {
  log(
    `[updateRepositoryCatalog] initiated, repository id: ${repository.id},
    publishedAt: ${publishedAt}`,
  );
  return getRepositoryCatalog()
    .then((catalog) => {
      const existing = find(catalog, { id: repository.id });
      if (!existing && repository.deletedAt) return;
      const repositoryData = {
        ...(updateInfo || !existing
          ? getRepositoryAttrs(repository)
          : existing),
        publishedAt: publishedAt || existing.publishedAt,
        detachedAt: repository.deletedAt,
      };
      if (existing) {
        log('[updateRepositoryCatalog] repository found in catalog');
        Object.assign(existing, omit(repositoryData, ['id']));
      } else {
        log('[updateRepositoryCatalog] repository not found in catalog');
        catalog.push(repositoryData);
      }
      const data = Buffer.from(JSON.stringify(catalog), 'utf8');
      return storage.saveFile('repository/index.json', data);
    })
    .then(() => log('[updateRepositoryCatalog] completed'));
}

async function publishRepositoryDetails(repository) {
  log(`[publishRepositoryDetails] initiated, repository id: ${repository.id}`);
  const spine = await getPublishedStructure(repository);
  Object.assign(spine, getRepositoryAttrs(repository));
  await updatePublishingStatus(repository);
  const savedSpine = await saveSpine(spine);
  await updateRepositoryCatalog(repository, savedSpine.publishedAt);
  log('[publishRepositoryDetails] completed');
  return repository;
}

function unpublishActivity(repository, activity) {
  log(
    `[unpublishActivity] initiated, repository id: ${repository.id},
    activity id: ${activity.id}`,
  );
  return getPublishedStructure(repository).then((spine) => {
    const spineActivity = find(spine.structure, { id: activity.id });
    if (!spineActivity) return;

    const deleted = getSpineChildren(spine, activity).concat(spineActivity);
    return Promise.map(deleted, (it) => {
      const baseUrl = getBaseUrl(repository.id, it.id);
      const filePaths = getContainersFilePaths(baseUrl, it.contentContainers);
      log(
        `[unpublishActivity] deleting containers, container ids: ${map(
          it.contentContainers,
          'id',
        ).join()}`,
      );
      return storage.deleteFiles(filePaths);
    })
      .then(() => {
        spine.structure = filter(
          spine.structure,
          ({ id }) => !find(deleted, { id }),
        );
        return saveSpine(spine);
      })
      .then((savedSpine) =>
        updateRepositoryCatalog(repository, savedSpine.publishedAt),
      )
      .then(() => activity.save())
      .then((activity) => {
        log('[unpublishActivity] completed');
        return activity;
      });
  });
}

function getStructureData(activity) {
  const repoData = activity.getRepository().then((repository) => {
    return getPublishedStructure(repository).then((spine) => ({
      repository,
      spine,
    }));
  });
  return Promise.all([repoData, activity.predecessors()]).spread(
    (repoData, predecessors) => Object.assign(repoData, { predecessors }),
  );
}

function getPublishedStructure(repository) {
  const storageKey = `repository/${repository.id}/index.json`;
  return storage.getFile(storageKey).then((buffer) => {
    const data = buffer && JSON.parse(buffer.toString('utf8'));
    return data || { ...getRepositoryAttrs(repository), structure: [] };
  });
}

async function fetchActivityContent(activity, signed = false) {
  let containers = await fetchContainers(activity);
  if (signed) containers = await Promise.map(containers, resolveContainer);
  return { containers };
}

async function publishContainers(parent) {
  log(`[publishContainers] initiated, parent id: ${parent.id}`);
  const containers = await fetchContainers(parent).map(async (it) => {
    const { id, publishedAs = 'container' } = it;
    await saveFile(parent, `${id}.${publishedAs}`, it);
    return it;
  });
  log(`[publishContainers] success, ids: ${map(containers, 'id').join()}`);
  return containers;
}

function fetchContainers(parent) {
  const typeConfigs = getSupportedContainers(parent.type);

  return Promise.all([
    fetchDefaultContainers(parent, typeConfigs),
    fetchCustomContainers(parent, typeConfigs),
  ]).reduce((containers, groupedContainers) => {
    const mappedContainers = groupedContainers.map((it) => {
      const config = find(typeConfigs, { type: it.type });
      const publishedAs = get(config, 'publishedAs', 'container');
      return { ...it, publishedAs, templateId: config.templateId };
    });
    return containers.concat(mappedContainers);
  }, []);
}

function fetchDefaultContainers(parent, config) {
  const include = [{ model: ContentElement.scope('publish') }];
  const types = config
    .filter((it) => !containerRegistry.getPublishStructureBuilder(it))
    .map((it) => it.type);
  const where = { type: types };
  const order = [[ContentElement, 'position', 'ASC']];

  return parent
    .getChildren({ attributes: CC_ATTRS, where, include, order })
    .map((container) => {
      const { ContentElements: ces, ...data } = container.toJSON();
      const elements = map(ces, (it, pos) => ({ ...it, position: pos + 1 }));
      return { ...data, elements };
    });
}

async function fetchCustomContainers(parent, config) {
  const include = [{ model: ContentElement.scope('publish') }];
  return Promise.reduce(
    config,
    async (containers, it) => {
      const builder = containerRegistry.getPublishStructureBuilder(it);
      if (!builder) return containers;
      const customContainers = await builder(parent, it.type, { include });
      return containers.concat(customContainers);
    },
    [],
  );
}

function unpublishDeletedContainers(parent, prevContainers, containers) {
  const baseUrl = getBaseUrl(parent.repositoryId, parent.id);
  const prevFilePaths = getContainersFilePaths(baseUrl, prevContainers);
  const filePaths = getContainersFilePaths(baseUrl, containers);
  const deletedContainerFiles = differenceWith(prevFilePaths, filePaths);
  if (deletedContainerFiles.length) {
    log('[unpublishDeletedContainers] deletable containers found');
    return storage.deleteFiles(deletedContainerFiles);
  }
}

async function resolveContainer(container) {
  const resolver = containerRegistry.getStaticsResolver(container);
  if (resolver) return resolver(container, hooks.applyFetchHooks);
  await Promise.map(container.elements, hooks.applyFetchHooks);
  return container;
}

function saveFile(parent, key, data) {
  const buffer = Buffer.from(JSON.stringify(data), 'utf8');
  const baseUrl = getBaseUrl(parent.repositoryId, parent.id);
  return storage.saveFile(`${baseUrl}/${key}.json`, buffer);
}

function saveSpine(spine) {
  const hashProperties = pick(
    spine,
    without(keys(spine), ['version', 'publishedAt']),
  );
  const version = hash(hashProperties, { algorithm: 'sha1' });
  const updatedSpine = { ...spine, version, publishedAt: new Date() };
  const spineData = Buffer.from(JSON.stringify(updatedSpine), 'utf8');
  const key = `repository/${spine.id}/index.json`;
  return storage.saveFile(key, spineData).then(() => updatedSpine);
}

function addToSpine(spine, activity) {
  const relationships = getLevelRelationships(activity.type);
  activity = Object.assign(
    pick(activity, [
      'id',
      'uid',
      'parentId',
      'type',
      'position',
      'data',
      'publishedAt',
      'updatedAt',
      'createdAt',
    ]),
    {
      relationships: mapRelationships(relationships, activity),
    },
  );
  renameKey(activity, 'data', 'meta');
  const index = findIndex(spine.structure, { id: activity.id });
  if (index < 0) {
    spine.structure.push(activity);
  } else {
    spine.structure[index] = activity;
  }
}

function getSpineChildren(spine, parent) {
  const children = filter(spine.structure, { parentId: parent.id });
  if (!children.length) return [];
  return children.concat(
    reduce(
      children,
      (acc, it) => {
        return acc.concat(getSpineChildren(spine, it));
      },
      [],
    ),
  );
}

function getRepositoryAttrs(repository) {
  const attrs = ['id', 'uid', 'schema', 'name', 'description', 'data'];
  const temp = pick(repository, attrs);
  renameKey(temp, 'data', 'meta');
  return temp;
}

function attachContainerSummary(obj, containers) {
  obj.contentContainers = map(containers, getContainerSummary);
}

function getContainerSummary(container) {
  const customBuilder = containerRegistry.getSummaryBuilder(container);
  return customBuilder
    ? customBuilder(container)
    : defaultSummaryBuilder(container);
}

function defaultSummaryBuilder({ id, uid, type, publishedAs, elements = [] }) {
  return { id, uid, type, publishedAs, elementCount: elements.length };
}

function getContainersFilePaths(baseUrl, containers = []) {
  return containers.map((it) => `${baseUrl}/${it.id}.${it.publishedAs}.json`);
}

function renameKey(obj, key, newKey) {
  obj[newKey] = obj[key];
  delete obj[key];
}

function getBaseUrl(repoId, parentId) {
  return FLAT_REPO_STRUCTURE
    ? `repository/${repoId}`
    : `repository/${repoId}/${parentId}`;
}

function mapRelationships(relationships, activity) {
  return relationships.reduce((acc, { type }) => {
    return Object.assign(acc, { [type]: get(activity, `refs.${type}`, []) });
  }, {});
}

// check if there is at least one outline activity with unpublished
// changes and upadate repository model accordingly
async function updatePublishingStatus(repository, activity) {
  const outlineTypes = map(getOutlineLevels(repository.schema), 'type');
  const where = {
    repositoryId: repository.id,
    type: outlineTypes,
    detached: false,
    [Op.or]: {
      publishedAt: { [Op.eq]: null },
      modifiedAt: { [Op.gt]: sequelize.col('published_at') },
    },
  };
  const debugContext = [`repository id: ${repository.id}`];
  if (activity) {
    where.id = { [Op.ne]: activity.id };
    debugContext.push(`activity id: ${activity.id}`);
  }
  const unpublishedCount = await Activity.count({ where });
  debugContext.push(`unpublishedCount: ${unpublishedCount}`);
  log(`[updatePublishingStatus] initiated, ${debugContext}`);
  return repository.update({ hasUnpublishedChanges: !!unpublishedCount });
}

export {
  getRepositoryCatalog,
  publishActivity,
  unpublishActivity,
  publishRepositoryDetails,
  updateRepositoryCatalog,
  updatePublishingStatus,
  fetchActivityContent,
  getRepositoryAttrs,
};
