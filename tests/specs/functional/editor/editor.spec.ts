import { expect, test } from '@playwright/test';

import { Container } from '../../../pom/editor/Container';
import { Editor } from '../../../pom/editor/Editor';
import SeedClient from '../../../api/SeedClient';
import { outlineSeed } from '../../../helpers/seed';
import { Relationship } from '../../../pom/editor/Relationship';
import { ContentElement } from '../../../pom/editor/ContentElement';

const REPOSITORY_NAME = 'Editor test repository';
const COMMENT_CONTENT = 'Content element test comment';

test.beforeEach(async ({ page }) => {
  await SeedClient.resetDatabase();
  const { data } = await SeedClient.seedTestRepository({
    name: REPOSITORY_NAME,
  });
  const { id: activityId, repositoryId } = data.activity;
  await SeedClient.seedComment({
    repositoryId,
    activityId,
    contentElementId: data.contentElement.id,
    content: COMMENT_CONTENT,
  });
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
  await editor.sidebar.toggleOutlineItems();
  const targetItem = page.locator('.sidebar').getByText(editor.primaryPageName);
  await expect(targetItem).toBeVisible();
  await editor.sidebar.toggleOutlineItems();
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
  await editor.sidebar.toggleOutlineItems();
  await editor.toSecondaryPage();
  await editor.addContentElement('This is a test');
  // Make sure changes are persisted
  await page.waitForTimeout(1000);
  await page.reload();
  await expect(editor.getElement('This is a test').el).toBeVisible();
});

test('can copy specific content element', async ({ page }) => {
  const editor = new Editor(page);
  await editor.sidebar.toggleOutlineItems();
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
  await editor.sidebar.toggleOutlineItems();
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
  await elements[0].postComment(comment);
  // Make sure changes are persisted
  await page.reload();
  await elements[0].openComments();
  await expect(page.getByText(comment)).toBeVisible();
});

test('can remove element comment', async ({ page }) => {
  const editor = new Editor(page);
  const element = await editor.getElement('The Origins of Pizza');
  const comment = await element.getComment(COMMENT_CONTENT);
  await comment.remove();
  // Make sure changes are persisted
  await page.reload();
  await element.openComments();
  await expect(page.getByText('This comment has been deleted')).toBeVisible();
});

test('can resolve element comment', async ({ page }) => {
  const editor = new Editor(page);
  const element = await editor.getElement('The Origins of Pizza');
  const comment = await element.getComment(COMMENT_CONTENT);
  await comment.resolve();
  // Make sure changes are persisted
  await page.reload();
  await element.openComments();
  await expect(page.getByText('Marked as resolved')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Undo' })).toBeVisible();
});

test('can edit element comment', async ({ page }) => {
  const editor = new Editor(page);
  const element = await editor.getElement('The Origins of Pizza');
  const comment = await element.getComment(COMMENT_CONTENT);
  const newComment = 'This is a test comment edited';
  await comment.edit(newComment);
  // Make sure changes are persisted
  await page.reload();
  await element.openComments();
  await expect(page.getByText(COMMENT_CONTENT)).not.toBeVisible();
  await expect(page.getByText('(edited)')).toBeVisible();
  await expect(page.getByText(newComment)).toBeVisible();
});

test.afterAll(async () => {
  await SeedClient.resetDatabase();
});
