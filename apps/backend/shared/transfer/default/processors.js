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
import roleConfig from '@tailor-cms/interfaces/role';
import { SCHEMAS } from '@tailor-cms/config';
import zipObject from 'lodash/zipObject.js';
import db from '../../database/index.js';
import { createLogger } from '#logger';
import { pinSchemaSnapshot } from '#app/repository/lib/schema.ts';
import { stripInstanceSpecific } from '#app/repository/lib/data-attr.ts';

const logger = createLogger('processors');

const { Activity, Asset, ContentElement, Repository, RepositoryUser, User } = db;
const { repository: role } = roleConfig;
const noop = Function.prototype;

const { ADMIN } = role;
const IGNORE_ATTRS = [
  'id', 'uid', 'publishedAt', 'createdAt', 'updatedAt',
  // Strip linking fields; source references are not portable across environments
  'isLinkedCopy', 'sourceId', 'sourceModifiedAt',
];

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

function createAssetsProcessor(options) {
  const destStream = createProcessor(processAssets, options);
  return miss.pipeline(parse(), destStream);
}

function createAssetProcessor({ storage, filename }) {
  return storage.createWriteStream(filename);
}

export default {
  createRepositoryProcessor,
  createActivitiesProcessor,
  createElementsProcessor,
  createAssetsProcessor,
  createManifestProcessor,
  createAssetProcessor,
};

// Captures the archive's schema config into context for the later
// repository step. Doesn't validate against the registry - that decision
// is deferred to processRepository which has the row's actual schema id
// and can pick "registry hit", "paste-mode fallback", or "fail".
function processManifest(manifest, _enc, { context }) {
  if (!manifest?.schema?.id) throw new Error('Manifest missing schema');
  context.manifestSchema = manifest.schema;
  context.assets.push(...manifest.assets);
}

async function processRepository(repository, _enc, { context, transaction }) {
  const { name, description, userId, userGroupIds, manifestSchema } = context;
  repository = normalize(repository, Repository);
  // Omitted description inherits the archived repository's own value (already
  // present on `repository`, straight from the archive's repository.json,
  // before this overwrite).
  Object.assign(repository, {
    name,
    description: description || repository.description,
  });
  // Defensive: archive may carry `$$.ai` (or other instance-specific
  // paths) from the source environment. Drop them but keep `$$.schema`
  // so paste-mode works when this instance doesn't have the schema id
  // in its registry.
  if (repository.data) repository.data = stripInstanceSpecific(repository.data);
  // Schema resolution at import time:
  //   - bundled in this instance: proceed; `$$.schema` is seeded
  //     lazily by the `getRepository` middleware on first load.
  //   - not bundled: pin the manifest's schema config (always
  //     present - `processManifest` throws otherwise and runs before
  //     this step). Pinning registers it with `@tailor-cms/config` so
  //     activity bulkCreate hooks can resolve types, and embeds the
  //     snapshot into the new repo's data.
  const isBundled = map(SCHEMAS, 'id').includes(repository.schema);
  if (!isBundled) {
    repository.data = pinSchemaSnapshot(repository.data, manifestSchema);
  }
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

// Recreates the whole asset library (every type, incl. links) from the
// archive's records. Storage files are imported separately; link and
// fileless records carry no bytes.
async function processAssets(assets, _enc, { context, transaction }) {
  const { repositoryId, userId } = context;
  if (!repositoryId) throw new Error('Invalid repository id');
  // Instance-specific fields ride into the archive
  // and are stripped here, the same strip-on-import path as IGNORE_ATTRS.
  const ignoreAttrs = [
    'id', 'uid', 'createdAt', 'updatedAt', 'deletedAt',
    'vectorStoreFileId', 'processingStatus',
  ];
  const records = map(assets, (it) => ({
    ...omit(normalize(it, Asset), ignoreAttrs),
    repositoryId,
    uploaderId: userId,
  }));
  return Asset.bulkCreate(records, { transaction });
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
      const newId = activityIdMap[oldId];
      // A dangling ref (target not in the archive / not inserted)
      if (!newId) {
        return logger.error(
          { activityId: activity.id, relationship: name, oldId },
          'Unable to resolve activity ref',
        );
      }
      activity.refs[name][index] = newId;
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
