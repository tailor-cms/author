import { expect, test } from '@playwright/test';

import { Editor } from '../../../pom/editor/Editor';
import SeedClient from '../../../api/SeedClient';

const REPOSITORY_NAME = 'Editor test repository';

test.beforeEach(async ({ page }) => {
  const { data } = await SeedClient.seedTestRepository({
    name: REPOSITORY_NAME,
  });
  const {
    activity: { repositoryId, id },
  } = data;
  await page.goto(`/repository/${repositoryId}/editor/${id}`);
});

test('editor page has a title set', async ({ page }) => {
  await expect(page).toHaveTitle(REPOSITORY_NAME);
});

test('can navigate using the sidebar', async ({ page }) => {
  const editor = new Editor(page);
  await page.waitForLoadState('networkidle');
  await editor.toPrimaryPage();
  await editor.toSecondaryPage();
});

test('can toggle using the sidebar', async ({ page }) => {
  const editor = new Editor(page);
  // Expand all
  await editor.sidebar.toggleItems();
  await expect(page.getByText('Oven Baking Basics')).toBeVisible();
  await editor.sidebar.toggleItems();
  await expect(page.getByText('Oven Baking Basics')).toBeHidden();
});

test('can add content element', async ({ page }) => {
  const editor = new Editor(page);
  await editor.sidebar.toggleItems();
  await editor.toSecondaryPage();
  await editor.addContentElement('This is a test');
  await page.waitForTimeout(1000);
  await page.reload();
  await expect(page.locator('.content-element')).toHaveText('This is a test');
});

test.afterAll(async () => {
  await SeedClient.resetDatabase();
});
