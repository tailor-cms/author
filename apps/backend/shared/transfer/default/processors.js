import filter from 'lodash/filter.js';
import forEach from 'lodash/forEach.js';
import isEmpty from 'lodash/isEmpty.js';
import last from 'lodash/last.js';
import map from 'lodash/map.js';
import miss from 'mississippi';
import omit from 'lodash/omit.js';
import { parse } from 'JSONStream';
import Promise from 'bluebird';
import reduce from 'lodash/reduce.js';
import roleConfig from '@tailor-cms/common/src/role.js';
import { SCHEMAS } from '@tailor-cms/config';
import zipObject from 'lodash/zipObject.js';
import db from '../../database/index.js';
import { createLogger } from '#logger';

const logger = createLogger('processors');

const { Activity, ContentElement, Repository, RepositoryUser, User } = db;
const { repository: role } = roleConfig;
const noop = Function.prototype;

const { ADMIN } = role;
const IGNORE_ATTRS = ['id', 'uid', 'publishedAt', 'createdAt', 'updatedAt'];

function createManifestProcessor(options) {
  const destStream = createProcessor(processManifest, options);
  return miss.pipeline(parse(), destStream);
}

function createRepositoryProcessor(options) {
  const destStream = createProcessor(processRepository, options);
  return miss.pipeline(parse(), destStream);
}

function createActivitiesProcessor(options) {
  const destStream = createProcessor(processActivities, options);
  return miss.pipeline(parse(), destStream);
}

function createElementsProcessor(options) {
  const destStream = createProcessor(processElements, options);
  return miss.pipeline(parse(), destStream);
}

function createAssetProcessor({ storage, filename }) {
  return storage.createWriteStream(filename);
}

export default {
  createRepositoryProcessor,
  createActivitiesProcessor,
  createElementsProcessor,
  createManifestProcessor,
  createAssetProcessor,
};

function processManifest(manifest, _enc, { context }) {
  const schemas = map(SCHEMAS, 'id');
  const isSupported = schemas.includes(manifest.schema.id);
  if (!isSupported) throw new Error('Schema not supported');
  context.assets.push(...manifest.assets);
}

async function processRepository(repository, _enc, { context, transaction }) {
  const { name, description, userId, userGroupIds } = context;
  repository = normalize(repository, Repository);
  Object.assign(repository, { description, name });
  const options = { context: { userId }, transaction };
  const repositoryRecord = omit(repository, IGNORE_ATTRS);
  const entity = await Repository.create(repositoryRecord, options);
  const { id } = entity;
  const userRecord = { userId, repositoryId: id, role: ADMIN, hasAccess: true };
  await RepositoryUser.create(userRecord, { transaction });
  if (userGroupIds?.length) {
    const user = await User.findByPk(userId);
    await entity.associateWithUserGroups(userGroupIds, user, transaction);
  }
  context.repositoryId = id;
}

async function processActivities(activities, _enc, options) {
  const withRefs = [];
  activities = map(activities, (it) => normalize(it, Activity));
  await Promise.each(groupByDepth(activities), async (group, depth) => {
    const inserted = await insertActivities(group, depth, options);
    const mappings = zipObject(map(group, 'id'), map(inserted, 'id'));
    Object.assign(options.context.activityIdMap, mappings);
    forEach(inserted, (activity) => {
      if (isEmpty(activity.refs)) return;
      withRefs.push(activity);
    });
  });
  await Promise.map(withRefs, (it) => remapActivityRefs(it, options));
}

async function processElements(elements, _enc, options) {
  elements = map(elements, (it) => normalize(it, ContentElement));
  const inserted = await insertElements(elements, options);
  const mappings = zipObject(map(elements, 'id'), map(inserted, 'id'));
  const uidMappings = zipObject(map(elements, 'uid'), map(inserted, 'uid'));
  Object.assign(options.context.elementIdMap, mappings);
  Object.assign(options.context.elementUidMap, uidMappings);
  await Promise.map(inserted, (it) => {
    if (isEmpty(it.refs)) return;
    return remapElementRefs(it, options);
  });
}

function insertActivities(activities, depth, { context, transaction }) {
  const { userId, repositoryId } = context;
  if (!repositoryId) throw new Error('Invalid repository id');
  const activityRecords = map(activities, (it) => {
    const parentId = context.activityIdMap[it.parentId];
    if (!parentId && depth) throw new Error('Invalid parent id');
    Object.assign(it, { parentId, repositoryId });
    return omit(it, IGNORE_ATTRS);
  });
  const options = { context: { userId }, returning: true, transaction };
  return Activity.bulkCreate(activityRecords, options);
}

function remapActivityRefs(activity, { context, transaction }) {
  const { activityIdMap } = context;
  forEach(activity.refs, (values, name) => {
    forEach(values, (oldId, index) => {
      if (!activityIdMap[oldId]) {
        throw new Error('Unable to resolve activity refs');
      }
      activity.refs[name][index] = activityIdMap[oldId];
    });
  });
  activity.changed('refs', true);
  return activity.save({ transaction });
}

function insertElements(elements, { context, transaction }) {
  const { activityIdMap, repositoryId, userId } = context;
  if (!repositoryId) throw new Error('Invalid repository id');
  const elementRecords = map(elements, (it) => {
    const activityId = activityIdMap[it.activityId];
    if (!activityId) throw new Error('Invalid activity id');
    Object.assign(it, { activityId, repositoryId });
    return omit(it, IGNORE_ATTRS);
  });
  const options = { context: { userId }, returning: true, transaction };
  return ContentElement.bulkCreate(elementRecords, options);
}

function remapElementRefs(element, { context, transaction }) {
  const { activityIdMap, elementIdMap, elementUidMap } = context;
  forEach(element.refs, (values, name) => {
    forEach(values, (ref, index) => {
      const id = elementIdMap[ref.id];
      const uid = elementUidMap[ref.uid];
      const outlineId = activityIdMap[ref.outlineId];
      const containerId = activityIdMap[ref.containerId];
      if (!id || (ref.uid && !uid) || !outlineId || !containerId) {
        return logger.error({ ref }, 'Unable to resolve element ref');
      }
      element.refs[name][index] = {
        id,
        ...(ref.uid && { uid }),
        outlineId,
        containerId,
      };
    });
  });
  element.changed('refs', true);
  return element.save({ transaction });
}

function groupByDepth(activities) {
  const rootActivities = filter(activities, (it) => !it.parentId);
  const groupedByDepth = [rootActivities];
  let children;

  do {
    children = getImmediateChildren(last(groupedByDepth));
    if (children.length) groupedByDepth.push(children);
  } while (children.length);

  return groupedByDepth;

  function getImmediateChildren(parentNodes) {
    const parentIds = map(parentNodes, 'id');
    return filter(activities, (it) => {
      return parentIds.includes(it.parentId);
    });
  }
}

function normalize(it, Model) {
  return reduce(
    it,
    (acc, value, key) => {
      const { fieldName } = Model.fieldRawAttributesMap[key];
      acc[fieldName] = value;
      return acc;
    },
    {},
  );
}

function createProcessor(transform = noop, flush = noop, options = {}) {
  if (arguments.length < 3) {
    options = flush;
    flush = noop;
  }
  return miss.through.obj(
    function (chunk, enc, cb) {
      return Promise.try(transform.bind(this, chunk, enc, options)).asCallback(
        (err) => cb(err),
      );
    },
    function (cb) {
      return Promise.try(flush.bind(this, options)).asCallback((err) =>
        cb(err),
      );
    },
  );
}
