import { expect, test } from '@playwright/test';

import { EndpointClient, getEndpointClient } from '../../api/client';
import { AddRepositoryDialog } from '../../pom/catalog/AddRepository';
import { Catalog } from '../../pom/catalog/Catalog';
import { percySnapshot } from '../../utils/percy.ts';

const TEST_REPOSITORY_NAME = 'Visual test imported repository';
let REPOSITORY_API: EndpointClient;

test.beforeAll(async ({ baseURL }) => {
  if (!baseURL) throw new Error('baseURL is required');
  REPOSITORY_API = await getEndpointClient(baseURL, '/api/repositories/');
});

test.beforeEach(async ({ page }) => {
  const catalog = new Catalog(page);
  await catalog.visit();
  const dialog = new AddRepositoryDialog(page);
  await dialog.open();
  await dialog.importRepository(TEST_REPOSITORY_NAME, 'Test description');
  await expect(page.getByText(TEST_REPOSITORY_NAME)).toBeVisible({
    timeout: 10000,
  });
  await catalog.findRepositoryCard(TEST_REPOSITORY_NAME).click();
  await page.waitForLoadState('networkidle');
});

test('Take a snapshot of the repository structure page', async ({ page }) => {
  await page.waitForTimeout(2000);
  await percySnapshot(page, 'Repository structure page');
});

test('Take a snapshot of the settings page', async ({ page }) => {
  const tabNavigation = page.getByTestId('repositoryRoot_nav');
  await tabNavigation.getByText('Settings').click();
  await page.waitForLoadState('networkidle');
  await percySnapshot(page, 'Repository settings page');
});

test.afterEach(async () => {
  const { data } = await REPOSITORY_API.list();
  const { items: repositories } = data;
  if (!repositories.length) return;
  for (const repository of repositories) {
    await REPOSITORY_API.remove(repository.id);
  }
});
