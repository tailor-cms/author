import { expect, test } from '@playwright/test';

import { Container } from '../../../pom/editor/Container';
import { Editor } from '../../../pom/editor/Editor';
import SeedClient from '../../../api/SeedClient';
import { outlineSeed } from '../../../helpers/seed';
import { Relationship } from '../../../pom/editor/Relationship';
import { ContentElement } from '../../../pom/editor/ContentElement';

const REPOSITORY_NAME = 'Editor test repository';

test.beforeEach(async ({ page }) => {
  await SeedClient.resetDatabase();
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
  // Methods contain assertions
  await editor.toPrimaryPage();
  await editor.toSecondaryPage();
});

test('can toggle using the sidebar', async ({ page }) => {
  const editor = new Editor(page);
  // First toggle expands all outline items
  await editor.sidebar.toggleItems();
  const targetItem = page.locator('.sidebar').getByText(editor.primaryPageName);
  await expect(targetItem).toBeVisible();
  await editor.sidebar.toggleItems();
  await expect(targetItem).toBeHidden();
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
  await expect(editor.getElement('This is a test')).toBeVisible();
});

test('can copy specific content element', async ({ page }) => {
  const editor = new Editor(page);
  await editor.sidebar.toggleItems();
  await editor.toSecondaryPage();
  const elContent = 'The Origins of Pizza';
  await editor.copyContentElements(outlineSeed.primaryPage.title, elContent);
  // Make sure changes are persisted
  await page.waitForTimeout(1000);
  await page.reload();
  await expect(editor.getElement(elContent)).toBeVisible();
});

test('can copy all content elements from page', async ({ page }) => {
  const editor = new Editor(page);
  await editor.sidebar.toggleItems();
  await editor.toSecondaryPage();
  await editor.copyContentElements(outlineSeed.primaryPage.title);
  // Make sure changes are persisted
  await page.waitForTimeout(1000);
  await page.reload();
  await expect(page.locator(ContentElement.selector)).toHaveCount(4);
});

test('can link specific content element', async ({ page }) => {
  const editor = new Editor(page);
  const pageTitle = outlineSeed.primaryPage.title;
  await editor.focusElement('The Art and Science of Pizza Making');
  const relationship = new Relationship(page, 'Related content');
  await relationship.add(pageTitle, 'The Origins of Pizza');
  // Make sure changes are persisted
  await page.reload();
  await expect(relationship.overview).toContainText(`${pageTitle} (1)`);
});

test('can link all content element from page', async ({ page }) => {
  const editor = new Editor(page);
  const pageTitle = outlineSeed.primaryPage.title;
  await editor.focusElement('The Art and Science of Pizza Making');
  const relationship = new Relationship(page, 'Related content');
  await relationship.add(pageTitle);
  // Make sure changes are persisted
  await page.reload();
  await expect(relationship.overview).toContainText(`${pageTitle} (3)`);
});

test('can remove content element links', async ({ page }) => {
  const editor = new Editor(page);
  const pageTitle = outlineSeed.primaryPage.title;
  await editor.focusElement('The Origins of Pizza');
  const relationship = new Relationship(page, 'Related content');
  await expect(relationship.overview).toContainText(`${pageTitle} (1)`);
  await relationship.clear();
  // Make sure changes are persisted
  await page.reload();
  await expect(relationship.overview).toBeEmpty();
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
