import differenceWith from 'lodash/differenceWith.js';
import find from 'lodash/find.js';
import map from 'lodash/map.js';
import Promise from 'bluebird';
import { schema } from '@tailor-cms/config';

import { getBaseUrl, log } from './utils.js';
import hooks from '#app/content-element/hooks.js';
import db from '#shared/database/index.js';
import PluginRegistry from '#shared/content-plugins/index.js';
import storage from '#storage';

const { containerRegistry } = PluginRegistry;
const { ContentElement } = db;

function saveFile(parent, key, data) {
  const buffer = Buffer.from(JSON.stringify(data), 'utf8');
  const baseUrl = getBaseUrl(parent.repositoryId, parent.id);
  return storage.saveFile(`${baseUrl}/${key}.json`, buffer);
}

function getContainersFilePaths(baseUrl, containers = []) {
  return containers.map((it) => `${baseUrl}/${it.id}.${it.publishedAs}.json`);
}

export class ContentContainer {
  static async publish(parent) {
    log(`[containers:publish] initiated, parent id: ${parent.id}`);
    const containers = await ContentContainer.fetch(parent);
    await Promise.map(containers, async (container) => {
      const { id, publishedAs = 'container' } = container;
      await saveFile(parent, `${id}.${publishedAs}`, container);
    });
    log(`[containers:publish] success, ids: ${map(containers, 'id').join()}`);
    return containers;
  }

  static async unpublish(parent, publishedContainers, excludedContainers = []) {
    if (!publishedContainers?.length) return;
    const baseUrl = getBaseUrl(parent.repositoryId, parent.id);
    const filePaths = getContainersFilePaths(baseUrl, publishedContainers);
    const excludedFilePaths = getContainersFilePaths(baseUrl, excludedContainers);
    const deletePaths = differenceWith(filePaths, excludedFilePaths);
    if (!deletePaths?.length) return;
    log(`[containers:unpublish] deleting: ${deletePaths.concat(', ')}`);
    return storage.deleteFiles(deletePaths);
  }

  static async fetch(parent, signed = false) {
    const configs = schema.getSupportedContainers(parent.type);
    const containers = await Promise.all([
      fetchDefaultContainers(parent, configs),
      fetchCustomContainers(parent, configs),
    ]).reduce((containers, groupedContainers) => {
      const processedContainers = groupedContainers.map((it) => {
        const config = find(configs, { type: it.type });
        const publishedAs = config?.publishedAs || 'container';
        return { ...it, publishedAs, templateId: config.templateId };
      });
      return containers.concat(processedContainers);
    }, []);
    return signed ? Promise.map(containers, resolveContainer) : containers;
  }

  static attachContainerSummary(activity, containers) {
    activity.contentContainers = map(containers, getContainerSummary);
  }
}

function fetchDefaultContainers(parent, config) {
  const include = [{ model: ContentElement.scope('publish') }];
  const types = config
    .filter((it) => !containerRegistry.getPublishStructureBuilder(it))
    .map((it) => it.type);
  const where = { type: types };
  const order = [[ContentElement, 'position', 'ASC']];
  const attributes = [
    'id',
    'uid',
    'type',
    'position',
    'createdAt',
    'updatedAt',
  ];
  return parent
    .getChildren({ attributes, where, include, order })
    .map((container) => {
      const { ContentElements: ces, ...data } = container.toJSON();
      const elements = map(ces, (it, pos) => ({ ...it, position: pos + 1 }));
      return { ...data, elements };
    });
}

function fetchCustomContainers(parent, config) {
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

async function resolveContainer(container) {
  const resolver = containerRegistry.getStaticsResolver(container);
  if (resolver) return resolver(container, hooks.applyFetchHooks);
  await Promise.map(container.elements, hooks.applyFetchHooks);
  return container;
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
