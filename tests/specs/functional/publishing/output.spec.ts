import { expect, test } from '@playwright/test';

import { isStorageConfigured, StorageClient } from '../../../api/StorageClient';
import { GeneralSettings } from '../../../pom/repository/RepositorySettings';
import SeedClient from '../../../api/SeedClient';
import {
  toLinkedRepositories,
  toSeededRepositorySettings,
} from '../../../helpers/seed';

test.beforeEach(async () => {
  await SeedClient.resetDatabase();
});

test('should be able to publish repository', async ({ page }) => {
  test.skip(!isStorageConfigured, 'Storage is not enabled');
  const { repository, activity } = await toSeededRepositorySettings(page);
  const settingsPage = new GeneralSettings(page);
  await settingsPage.sidebar.publish();
  const publishedRepository = await StorageClient.source().get(repository.id);
  expect(publishedRepository).toBeDefined();
  expect(publishedRepository.id).toBe(repository.id);
  expect(publishedRepository.name).toBe(repository.name);
  await publishedRepository.load();
  const publishedActivity = publishedRepository.activitiesWithContainers.find(
    (it) => it.id === activity.id,
  );
  expect(publishedActivity).toBeDefined();
  // Based on the seed data, the activity has 2 content containers
  // First has 4 elements
  expect(publishedActivity?.contentContainers.length).toBe(2);
  expect(publishedActivity?.contentContainers[0].elements).toHaveLength(4);
  await publishedActivity?.makePublic();
  const imageElement = publishedActivity?.contentContainers[0].elements.find(
    (it) => it.type === 'IMAGE',
  );
  expect(imageElement).toBeDefined();
  // Check if public URL is generated
  expect(imageElement?.data?.url).toBeDefined();
});

test('should publish linked content with sourceId and isLinkedCopy', async ({
  page,
}) => {
  test.skip(!isStorageConfigured, 'Storage is not enabled');
  const { activity, linkedActivity } = await toLinkedRepositories();
  const targetRepoId = linkedActivity.repositoryId;
  // Navigate to linked repository settings and publish
  await page.goto(`/repository/${targetRepoId}/root/settings/general`);
  await page.waitForLoadState('networkidle');
  const settingsPage = new GeneralSettings(page);
  await settingsPage.sidebar.publish();
  // Read the published manifest from storage
  const publishedRepo = await StorageClient.source().get(targetRepoId);
  expect(publishedRepo).toBeDefined();
  await publishedRepo.load();
  // Verify linked activity in published structure
  const publishedActivity = publishedRepo.structure.find(
    (it: any) => it.id === linkedActivity.id,
  );
  expect(publishedActivity).toBeDefined();
  expect(publishedActivity.sourceId).toBe(activity.id);
  expect(publishedActivity.isLinkedCopy).toBe(true);
  // Verify content elements preserve linked fields
  const activityWithContainers =
    publishedRepo.activitiesWithContainers.find(
      (it: any) => it.id === linkedActivity.id,
    );
  expect(activityWithContainers).toBeDefined();
  const container = activityWithContainers.contentContainers[0];
  expect(container.elements.length).toBeGreaterThan(0);
  for (const element of container.elements) {
    expect(element.sourceId).toBeDefined();
    expect(element.isLinkedCopy).toBe(true);
  }
});

test.afterAll(async () => {
  await SeedClient.resetDatabase();
});
