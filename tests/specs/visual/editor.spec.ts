import { test } from '@playwright/test';

import { percySnapshot } from '../../utils/percy.ts';
import SeedClient from '../../api/SeedClient';

test.beforeEach(async ({ page }) => {
  await SeedClient.resetDatabase();
  const { data } = await SeedClient.seedTestRepository({
    name: 'Visual test imported repository',
  });
  const {
    activity: { repositoryId, id },
  } = data;
  await page.goto(`/repository/${repositoryId}/editor/${id}`);
});

test('Take a snapshot of the editor page', async ({ page }) => {
  await page.getByText('The story of pizza begins').isVisible();
  await page.waitForTimeout(2000);
  await percySnapshot(page, 'Editor page');
});

test.afterAll(async () => {
  await SeedClient.resetDatabase();
});
