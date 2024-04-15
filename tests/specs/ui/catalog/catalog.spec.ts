import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('Catalog page has a title set', async ({ page }) => {
  await expect(page).toHaveTitle(/Catalog/);
});

test.afterAll(async () => {
  // TODO: Cleanup
});
