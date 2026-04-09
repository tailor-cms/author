import { expect, test } from '@playwright/test';

import { Container } from '../../../pom/editor/Container';
import { Editor } from '../../../pom/editor/Editor';
import SeedClient from '../../../api/SeedClient';

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
