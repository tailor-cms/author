import { expect, test as base } from '@playwright/test';

import { Container } from '../../../pom/editor/Container';
import { Editor } from '../../../pom/editor/Editor';
import SeedClient from '../../../api/SeedClient';
import { outlineSeed } from '../../../helpers/seed';
import { Relationship } from '../../../pom/editor/Relationship';
import { ContentElement } from '../../../pom/editor/ContentElement';

const REPOSITORY_NAME = 'Editor test repository';

type TestFixtures = {
  seedData: {
    activity: Record<string, any>;
    contentElement: Record<string, any>;
    repository: Record<string, any>;
  };
};

const test = base.extend<TestFixtures>({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  seedData: async ({ page }, use) => {
    await SeedClient.resetDatabase();
    const { data } = await SeedClient.seedTestRepository({
      name: REPOSITORY_NAME,
    });
    await use(data);
  },
});

test.beforeEach(async ({ page, seedData }) => {
  const {
    activity: { repositoryId, id: activityId },
  } = seedData;
  await page.goto(`/repository/${repositoryId}/editor/${activityId}`);
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
  await expect(editor.getElement('This is a test').el).toBeVisible();
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
  await expect(editor.getElement(elContent).el).toBeVisible();
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

test('can post comment on element', async ({ page }) => {
  const editor = new Editor(page);
  await expect(page.getByText(editor.primaryPageContent)).toBeVisible();
  await expect(page.locator(Container.selector)).toHaveCount(1);
  const containers = await editor.containerList.getContainers();
  const elements = await containers[0].getElements();
  expect(elements.length).not.toBe(0);
  const comment = 'This is a test comment';
  await elements[0].comment(comment);
  // Make sure changes are persisted
  await page.reload();
  await elements[0].openComments();
  await expect(page.getByText(comment)).toBeVisible();
});

test('can remove element comment', async ({ page, seedData }) => {
  const editor = new Editor(page);
  const content = 'This is a test comment';
  const { id: activityId, repositoryId } = seedData.activity;
  const { id: contentElementId } = seedData.contentElement;
  await SeedClient.seedComment({
    contentElementId,
    activityId,
    repositoryId,
    content,
  });
  await expect(page.getByText(editor.primaryPageContent)).toBeVisible();
  await expect(page.locator(Container.selector)).toHaveCount(1);
  await page.reload();
  const element = await editor.getElement('The Origins of Pizza');
  await element.openComments();
  const comment = element.comments.getComment(content);
  await expect(comment.el).toBeVisible();
  await comment.remove();
  // Make sure changes are persisted
  await element.openComments();
  await expect(comment.el).not.toBeVisible();
  await expect(page.getByText('This comment has been deleted')).toBeVisible();
});

test.afterAll(async () => {
  await SeedClient.resetDatabase();
});
