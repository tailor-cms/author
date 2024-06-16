import { expect, test } from '@playwright/test';

import { ActivityOutline } from '../../pom/repository/Outline.ts';
import ApiClient from '../../api/ApiClient';
import { percySnapshot } from '../../utils/percy.ts';
import SeedClient from '../../api/SeedClient';

const REPOSITORY_API = new ApiClient('/api/repositories/');

const toSeededRepository = async (page) => {
  await SeedClient.resetDatabase();
  const { data } = await SeedClient.seedTestRepository({
    name: 'Visual test imported repository',
  });
  await page.goto(`/repository/${data.repository.id}/root/structure`);
};

const toEmptyRepository = async (page) => {
  const payload = {
    schema: 'COURSE_SCHEMA',
    name: 'Visual test imported repository',
    description: 'Test',
  };
  const { data: repository } = await REPOSITORY_API.create(payload as any);
  await page.goto(`/repository/${repository.id}/root/structure`);
  await page.waitForLoadState('networkidle');
  return repository;
};

test('Take a snapshot of the repository structure page', async ({ page }) => {
  await toSeededRepository(page);
  await page.getByText('Introduction to Pizza Making').isVisible();
  await percySnapshot(page, 'Repository structure page');
});

test('Take a snapshot of the history page', async ({ page }) => {
  await toEmptyRepository(page);
  const outline = new ActivityOutline(page);
  await outline.addRootItem('Module', 'Module 1');
  const tabNavigation = page.getByTestId('repositoryRoot_nav');
  await tabNavigation.getByText('History').click();
  await expect(page.getByText('Created repository')).toBeVisible();
  await expect(page.getByText('Created Module 1 module')).toBeVisible();
  await percySnapshot(page, 'Repository history page');
});

test('Take a snapshot of the settings page', async ({ page }) => {
  await toSeededRepository(page);
  const tabNavigation = page.getByTestId('repositoryRoot_nav');
  await tabNavigation.getByText('Settings').click();
  await page.waitForLoadState('networkidle');
  await percySnapshot(page, 'Repository settings page');
});

test.afterAll(async () => {
  await SeedClient.resetDatabase();
});
