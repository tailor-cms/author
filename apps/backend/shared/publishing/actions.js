import map from 'lodash/map.js';
import omit from 'lodash/omit.js';
import { schema } from '@tailor-cms/config';
import { log } from './utils.js';
import { ContentContainer } from './ContentContainer.js';
import { RepositoryManifest } from './RepositoryManifest.js';
import storage from '#storage';
import db from '#shared/database/index.js';

const { Activity, Sequelize, sequelize } = db;
const { Op } = Sequelize;

async function getRepositoryCatalog() {
  const buffer = await storage.getFile('repository/index.json');
  if (!buffer) return [];
  return JSON.parse(buffer.toString('utf8'));
}

async function updateRepositoryCatalog(
  repository,
  publishedAt,
  updateInfo = true, // if already exists
) {
  log(
    `[updateRepositoryCatalog] initiated, repository id: ${repository.id},
    publishedAt: ${publishedAt}`,
  );
  const catalog = await getRepositoryCatalog();
  const existing = catalog.find((it) => it.id === repository.id);
  if (!existing && repository.deletedAt) return;
  const shouldUpdateRepositoryInfo = updateInfo || !existing;
  const entry = {
    ...(shouldUpdateRepositoryInfo
      ? RepositoryManifest.pickRepositoryAttrs(repository)
      : existing),
    publishedAt: publishedAt || existing?.publishedAt || new Date(),
    detachedAt: repository.deletedAt,
  };
  if (existing) {
    log('[updateRepositoryCatalog] repository found in catalog');
    Object.assign(existing, omit(entry, ['id']));
  } else {
    log('[updateRepositoryCatalog] repository not found in catalog');
    catalog.push(entry);
  }
  const data = Buffer.from(JSON.stringify(catalog), 'utf8');
  await storage.saveFile('repository/index.json', data);
  log('[updateRepositoryCatalog] completed');
}

async function publishRepositoryDetails(repository) {
  log(`[publishRepositoryDetails] initiated, repository id: ${repository.id}`);
  const manifest = await RepositoryManifest.load(repository);
  const publishedData = await manifest.update();
  await updatePublishingStatus(repository);
  await updateRepositoryCatalog(repository, publishedData.publishedAt);
  log('[publishRepositoryDetails] completed');
  return repository;
}

async function publishActivity(activity) {
  log(`[publishActivity] initiated, activity id: ${activity.id}`);
  const repository = await activity.getRepository();
  const manifest = await RepositoryManifest.load(repository);
  activity.publishedAt = new Date();
  const publishedData = await manifest.publishActivity(activity);
  await updateRepositoryCatalog(repository, publishedData.publishedAt, false);
  await updatePublishingStatus(repository, activity);
  await activity.save();
  log(`[publishActivity] completed, activity id: ${activity.id}`);
  return activity;
}

async function unpublishActivity(activity) {
  log(
    `[unpublishActivity] initiated, repository id: ${activity.repositoryId},
    activity id: ${activity.id}`,
  );
  const repository = await activity.getRepository();
  const manifest = await RepositoryManifest.load(repository);
  const publishedManifest = manifest.unpublishActivity(activity);
  await updateRepositoryCatalog(repository, publishedManifest.publishedAt);
  activity.publishedAt = new Date();
  await activity.save();
  log('[unpublishActivity] completed');
  return activity;
}

// Check if there is at least one outline activity with unpublished
// changes and upadate repository model accordingly
async function updatePublishingStatus(repository, activity) {
  const outlineTypes = map(schema.getOutlineLevels(repository.schema), 'type');
  const where = {
    repositoryId: repository.id,
    type: outlineTypes,
    detached: false,
    // Not published at all or has unpublished changes
    [Op.or]: [
      {
        publishedAt: { [Op.gt]: 0 },
        modifiedAt: { [Op.gt]: sequelize.col('published_at') },
      },
      { publishedAt: null, deletedAt: null },
    ],
  };
  const debugContext = [`repository id: ${repository.id}`];
  if (activity) {
    where.id = { [Op.ne]: activity.id };
    debugContext.push(`activity id: ${activity.id}`);
  }
  const unpublishedCount = await Activity.count({ where, paranoid: false });
  debugContext.push(`unpublishedCount: ${unpublishedCount}`);
  log(`[updatePublishingStatus] initiated, ${debugContext}`);
  return repository.update({ hasUnpublishedChanges: !!unpublishedCount });
}

async function fetchActivityContent(activity, signed = false) {
  let containers = await ContentContainer.fetch(activity, signed);
  return { containers };
}

export {
  publishActivity,
  unpublishActivity,
  publishRepositoryDetails,
  updateRepositoryCatalog,
  updatePublishingStatus,
  fetchActivityContent,
};
