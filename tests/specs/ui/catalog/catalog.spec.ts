import { expect, test } from '@playwright/test';

import { AddRepositoryDialog } from '../../../pom/catalog/AddRepository';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('catalog page has a title set', async ({ page }) => {
  await expect(page).toHaveTitle(/Catalog/);
});

test('should be able to create a new repository', async ({ page }) => {
  const dialog = new AddRepositoryDialog(page);
  await dialog.open();
  await dialog.createRepository();
});

test.afterAll(async () => {
  // TODO: Cleanup
});
