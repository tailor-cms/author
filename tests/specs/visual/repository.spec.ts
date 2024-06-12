import { test } from '@playwright/test';

import { percySnapshot } from '../../utils/percy.ts';
import SeedClient from '../../api/SeedClient';

test.beforeEach(async ({ page }) => {
  const { data } = await SeedClient.seedTestRepository({
    name: 'Visual test imported repository',
  });
  await page.goto(`/repository/${data.repository.id}/root/structure`);
});

test('Take a snapshot of the repository structure page', async ({ page }) => {
  await page.getByText('Introduction to Pizza Making').isVisible();
  await percySnapshot(page, 'Repository structure page');
});

test('Take a snapshot of the settings page', async ({ page }) => {
  const tabNavigation = page.getByTestId('repositoryRoot_nav');
  await tabNavigation.getByText('Settings').click();
  await page.waitForLoadState('networkidle');
  await percySnapshot(page, 'Repository settings page');
});

test.afterEach(async () => {
  await SeedClient.resetDatabase();
});
