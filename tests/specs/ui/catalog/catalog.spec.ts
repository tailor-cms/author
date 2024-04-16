import { expect, test } from '@playwright/test';

import { EndpointClient, getEndpointClient } from '../../../api/client';
import { AddRepositoryDialog } from '../../../pom/catalog/AddRepository';

let repositoryAPI: EndpointClient;

test.beforeAll(async ({ baseURL }) => {
  repositoryAPI = await getEndpointClient(baseURL, '/api/repositories');
  const { data } = await repositoryAPI.list();
  const { items: repositories } = data;
  await Promise.all(repositories.map((repo) => repositoryAPI.remove(repo.id)));
});

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('catalog page has a title set', async ({ page }) => {
  await expect(page).toHaveTitle(/Catalog/);
});

test(`should have 'no available repositories' message visible`, async ({
  page,
}) => {
  await expect(page.getByText('0 available repositories')).toBeVisible();
});

test('should be able to create a new repository', async ({ page }) => {
  const dialog = new AddRepositoryDialog(page);
  await dialog.open();
  await dialog.createRepository();
});

test.afterAll(async () => {
  // TODO: Cleanup
});
