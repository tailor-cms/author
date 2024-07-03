import { expect, test } from '@playwright/test';

import { Container } from '../../../pom/editor/Container';
import { Editor } from '../../../pom/editor/Editor';
import SeedClient from '../../../api/SeedClient';
import { toSeededRepository } from '../../../helpers/seed';

const REPOSITORY_NAME = 'Editor test repository';

test.beforeEach(async ({ page }) => {
  await SeedClient.resetDatabase();
  await toSeededRepository(page, REPOSITORY_NAME);
  await page.waitForLoadState('networkidle');
});

test('editor page has a title set', async ({ page }) => {
  await expect(page).toHaveTitle(REPOSITORY_NAME);
});

test('can navigate using the sidebar', async ({ page }) => {
  const editor = new Editor(page);
  // Methods contain assertions
  await editor.toPrimaryPage();
  await editor.toSecondaryPage();
});

test('can toggle using the sidebar', async ({ page }) => {
  const editor = new Editor(page);
  // First toggle expands all outline items
  await editor.sidebar.toggleItems();
  await expect(page.getByText(editor.primaryPageName)).toBeVisible();
  await editor.sidebar.toggleItems();
  await expect(page.getByText(editor.primaryPageName)).toBeHidden();
});

test('can create content container', async ({ page }) => {
  const editor = new Editor(page);
  await expect(page.getByText(editor.primaryPageContent)).toBeVisible();
  await expect(page.locator(Container.selector)).toHaveCount(1);
  await editor.containerList.addContainer();
  await expect(page.locator(Container.selector)).toHaveCount(2);
  // Make sure changes are persisted
  await page.reload();
  await expect(page.getByText(editor.primaryPageContent)).toBeVisible();
  await expect(page.locator(Container.selector)).toHaveCount(2);
});

test('can delete content container', async ({ page }) => {
  const editor = new Editor(page);
  await expect(page.getByText(editor.primaryPageContent)).toBeVisible();
  await expect(page.locator(Container.selector)).toHaveCount(1);
  const containers = await editor.containerList.getContainers();
  await containers[0].remove();
  await expect(page.getByText(editor.primaryPageContent)).not.toBeVisible();
  await expect(page.locator(Container.selector)).toHaveCount(0);
  // Make sure changes are persisted
  await page.reload();
  await expect(page.getByText(editor.primaryPageContent)).not.toBeVisible();
});

test('can add content element', async ({ page }) => {
  const editor = new Editor(page);
  await editor.sidebar.toggleItems();
  await editor.toSecondaryPage();
  await editor.addContentElement('This is a test');
  // Make sure changes are persisted
  await page.waitForTimeout(1000);
  await page.reload();
  await expect(page.locator('.content-element')).toHaveText('This is a test');
});

test('can delete content element', async ({ page }) => {
  const editor = new Editor(page);
  await expect(page.getByText(editor.primaryPageContent)).toBeVisible();
  await expect(page.locator(Container.selector)).toHaveCount(1);
  const containers = await editor.containerList.getContainers();
  const elements = await containers[0].getElements();
  expect(elements.length).not.toBe(0);
  await containers[0].deleteElements();
  await expect(page.getByText(editor.primaryPageContent)).not.toBeVisible();
  // Make sure changes are persisted
  await page.reload();
  await expect(page.getByText(editor.primaryPageContent)).not.toBeVisible();
});

test.afterAll(async () => {
  await SeedClient.resetDatabase();
});
