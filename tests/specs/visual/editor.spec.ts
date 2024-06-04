import { expect, test } from '@playwright/test';

import { EndpointClient, getEndpointClient } from '../../api/client';
import { ActivityOutline } from '../../pom/repository/Outline';
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
  const outline = new ActivityOutline(page);
  await outline.toggleExpand();
  const item = await outline.getOutlineItemByName('History of Pizza');
  await item.select();
  await item.openBtn.click();
});

test('Take a snapshot of the editor page', async ({ page }) => {
  await page.waitForLoadState('networkidle');
  // Make sure content is loaded
  await page.getByText('The story of pizza begins').isVisible();
  await percySnapshot(page, 'Editor page');
});

test.afterEach(async () => {
  const { data } = await REPOSITORY_API.list();
  const { items: repositories } = data;
  if (!repositories.length) return;
  for (const repository of repositories) {
    await REPOSITORY_API.remove(repository.id);
  }
});
