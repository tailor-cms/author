import omit from 'lodash/omit.js';

import { log, PublishEnv } from './utils.js';
import { ActivityContainers } from './ActivityContainers.js';
import { RepositoryManifest } from './RepositoryManifest.js';
import storage from '#storage';

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
  await repository.updatePublishingStatus();
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
  await repository.updatePublishingStatus(activity);
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

async function fetchActivityContent(activity, signed = false, env = PublishEnv.DEFAULT) {
  const activityContainers = new ActivityContainers(env, activity);
  let containers = await activityContainers.fetch(signed);
  return { containers };
}

export {
  publishActivity,
  unpublishActivity,
  publishRepositoryDetails,
  updateRepositoryCatalog,
  fetchActivityContent,
};
