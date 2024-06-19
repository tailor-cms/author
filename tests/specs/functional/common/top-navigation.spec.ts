import { expect, test } from '@playwright/test';

import { ActivityOutline } from '../../../pom/repository/Outline.ts';
import { AppBar } from '../../../pom/common/AppBar.ts';
import SeedClient from '../../../api/SeedClient.ts';
import { toSeededRepository } from '../../../helpers/seed.ts';

test.beforeEach(async ({ page }) => {
  await SeedClient.resetDatabase();
  await page.goto('/');
});

test('should be able to access admin page', async ({ page }) => {
  const appBar = new AppBar(page);
  await appBar.adminLink.click();
  await expect(page).toHaveTitle('Admin');
  await expect(page.getByText('System users')).toBeVisible();
});

test('should be able to navigate to the catalog page', async ({ page }) => {
  const appBar = new AppBar(page);
  await appBar.adminLink.click();
  await expect(page.getByText('System users')).toBeVisible();
  await appBar.catalogLink.click();
  await expect(page).toHaveTitle('Catalog');
  await expect(page.getByText('0 available repositories')).toBeVisible();
});

test('should be able to navigate to the current repository', async ({
  page,
}) => {
  await toSeededRepository(page);
  const outline = new ActivityOutline(page);
  await outline.toggleExpand();
  const outlineItem = await outline.getOutlineItemByName('History of Pizza');
  await outlineItem.select();
  await outlineItem.openBtn.click();
  await expect(page.getByText('The Origins of Pizza')).toBeVisible();
  const appBar = new AppBar(page);
  await appBar.repoLink.click();
  await expect(outlineItem.el).toBeVisible();
});

test.afterAll(async () => {
  await SeedClient.resetDatabase();
});
