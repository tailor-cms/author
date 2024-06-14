import { expect, test } from '@playwright/test';

import { Container } from '../../../pom/editor/Container';
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
  await page.waitForLoadState('networkidle');
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

test('can create content container', async ({ page }) => {
  const editor = new Editor(page);
  await expect(page.getByText(editor.primaryPageContent)).toBeVisible();
  const containers = await editor.containerList.getContainers();
  expect(containers.length).toBe(1);
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
  const containers = await editor.containerList.getContainers();
  expect(containers.length).toBe(1);
  await containers[0].remove();
  await expect(page.getByText(editor.primaryPageContent)).not.toBeVisible();
  await expect(
    page.getByText('Click the button below to create first Section.'),
  ).toBeVisible();
  // Make sure changes are persisted
  await page.reload();
  await expect(page.getByText(editor.primaryPageContent)).not.toBeVisible();
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

test('can delete content element', async ({ page }) => {
  await page.waitForLoadState('networkidle');
  const editor = new Editor(page);
  await expect(page.getByText(editor.primaryPageContent)).toBeVisible();
  const containers = await editor.containerList.getContainers();
  expect(containers.length).toBe(1);
  const elements = await containers[0].getElements();
  expect(elements.length).not.toBe(0);
  await containers[0].deleteElements();
  await expect(page.getByText(editor.primaryPageContent)).not.toBeVisible();
  await page.reload();
  await expect(page.getByText(editor.primaryPageContent)).not.toBeVisible();
});

test.afterAll(async () => {
  await SeedClient.resetDatabase();
});
