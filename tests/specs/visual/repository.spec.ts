import { expect, test } from '@playwright/test';

import {
  outlineLevel,
  outlineSeed,
  toEmptyRepository,
  toSeededRepository,
} from '../../helpers/seed';
import { ActivityOutline } from '../../pom/repository/Outline.ts';
import { percySnapshot } from '../../utils/percy.ts';
import SeedClient from '../../api/SeedClient';

const REPOSITORY_NAME = 'Visual test imported repository';

test('Take a snapshot of the repository structure page', async ({ page }) => {
  await toSeededRepository(page, REPOSITORY_NAME);
  await page.getByText(outlineSeed.group.title).isVisible();
  await percySnapshot(page, 'Repository structure page');
});

test('Take a snapshot of the history page', async ({ page }) => {
  await toEmptyRepository(page, REPOSITORY_NAME);
  const outline = new ActivityOutline(page);
  await outline.addRootItem(outlineLevel.GROUP, 'Module 1');
  const tabNavigation = page.getByTestId('repositoryRoot_nav');
  await tabNavigation.getByText('History').click();
  await expect(page.getByText('Created repository')).toBeVisible();
  await expect(page.getByText('Created Module 1 module')).toBeVisible();
  await percySnapshot(page, 'Repository history page');
});

test('Take a snapshot of the settings page', async ({ page }) => {
  await toSeededRepository(page, REPOSITORY_NAME);
  const tabNavigation = page.getByTestId('repositoryRoot_nav');
  await tabNavigation.getByText('Settings').click();
  await page.waitForLoadState('networkidle');
  await percySnapshot(page, 'Repository settings page');
});

test.afterAll(async () => {
  await SeedClient.resetDatabase();
});
