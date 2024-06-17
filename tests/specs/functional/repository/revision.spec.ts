import { expect, test } from '@playwright/test';

import { ActivityOutline } from '../../../pom/repository/Outline.ts';
import { Editor } from '../../../pom/editor/Editor.ts';
import SeedClient from '../../../api/SeedClient.ts';
import { toEmptyRepository } from '../../../helpers/seed.ts';

const TAB_NAV_TEST_ID = 'repositoryRoot_nav';

test.beforeEach(async () => {
  await SeedClient.resetDatabase();
});

test('should display a revision for created repository', async ({ page }) => {
  await toEmptyRepository(page);
  const tabNavigation = page.getByTestId(TAB_NAV_TEST_ID);
  await tabNavigation.getByText('History').click();
  await expect(page.getByText('Created repository')).toBeVisible();
  await expect(page.locator('.revision')).toHaveCount(1);
});

test('should display a revision for created module', async ({ page }) => {
  await toEmptyRepository(page);
  const outline = new ActivityOutline(page);
  const moduleName = 'Module 1';
  await outline.addRootItem('Module', moduleName);
  const tabNavigation = page.getByTestId(TAB_NAV_TEST_ID);
  await tabNavigation.getByText('History').click();
  await expect(page.getByText(`Created ${moduleName} module`)).toBeVisible();
  // Revisions for repository creation and module creation
  await expect(page.locator('.revision')).toHaveCount(2);
});

test('should display a revision for created content element', async ({
  page,
}) => {
  const repository = await toEmptyRepository(page);
  const outline = new ActivityOutline(page);
  const pageName = 'Page 1';
  await outline.addRootItem('Page', pageName);
  const item = await outline.getOutlineItemByName(pageName);
  await item.select();
  await item.openBtn.click();
  const editor = new Editor(page);
  await page.waitForLoadState('networkidle');
  await editor.addContentElement();
  await page.goto(`/repository/${repository.id}/root/revisions`);
  await expect(page.getByText('Created ce html default element')).toBeVisible();
  // Implicit upon opening the page
  await expect(page.getByText('Created section')).toBeVisible();
  await expect(page.getByText('Created Page 1 page')).toBeVisible();
  await expect(page.getByText('Created repository')).toBeVisible();
  await expect(page.locator('.revision')).toHaveCount(4);
});

test.afterAll(async () => {
  await SeedClient.resetDatabase();
});
