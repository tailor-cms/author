import { expect, test } from '@playwright/test';

import { ActivityOutline } from '../../../pom/repository/Outline.ts';
import { AppBar } from '../../../pom/common/AppBar.ts';
import { NavigationRail } from '../../../pom/repository/NavigationRail.ts';
import SeedClient from '../../../api/SeedClient.ts';
import { outlineSeed, toSeededRepository } from '../../../helpers/seed.ts';

test.beforeEach(async ({ page }) => {
  await SeedClient.resetDatabase();
  await page.goto('/');
});

test('should be able to access admin page', async ({ page }) => {
  const appBar = new AppBar(page);
  await appBar.goToAdmin();
  await expect(page).toHaveTitle('System Users');
  await expect(page.getByText('System Users')).toBeVisible();
});

test('should be able to navigate to the catalog page', async ({ page }) => {
  const appBar = new AppBar(page);
  await appBar.goToAdmin();
  await expect(page.getByText('System Users')).toBeVisible();
  await appBar.catalogLink.click();
  await expect(page).toHaveTitle('Catalog');
  await expect(page.getByText('No repositories yet')).toBeVisible();
});

test('should be able to navigate to the current repository', async ({
  page,
}) => {
  const { title, elementText } = outlineSeed.primaryPage;
  await toSeededRepository(page);
  const outline = new ActivityOutline(page);
  await outline.toggleExpand();
  const outlineItem = await outline.getOutlineItemByName(title);
  await outlineItem.select();
  await outlineItem.openBtn.click();
  await expect(page.getByText(elementText)).toBeVisible();
  await new NavigationRail(page).goToStructure();
  await expect(outlineItem.el).toBeVisible();
});

test.afterAll(async () => {
  await SeedClient.resetDatabase();
});
