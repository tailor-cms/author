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
  expect(publishedRepository.id).toBe(repository.id);
  expect(publishedRepository.name).toBe(repository.name);
  await publishedRepository.load();
  const publishedActivity = publishedRepository.activitiesWithContainers.find(
    (it) => it.id === activity.id,
  );
  expect(publishedActivity).toBeDefined();
  expect(publishedActivity?.contentContainers.length).not.toBe(0);
});

test.afterAll(async () => {
  await SeedClient.resetDatabase();
});
