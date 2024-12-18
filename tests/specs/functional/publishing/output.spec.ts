import { expect, test } from '@playwright/test';

import { GeneralSettings } from '../../../pom/repository/RepositorySettings';
import SeedClient from '../../../api/SeedClient';
import StorageClient from '../../../api/StorageClient';
import { toSeededRepositorySettings } from '../../../helpers/seed';

test.beforeEach(async () => {
  await SeedClient.resetDatabase();
});

test('should be able to publish repository', async ({ page }) => {
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
  // Based on the seed data, the activity has 1 content container with 4 elements
  expect(publishedActivity?.contentContainers.length).toBe(1);
  expect(publishedActivity?.contentContainers[0].elements).toHaveLength(4);
});

test.afterAll(async () => {
  await SeedClient.resetDatabase();
});
