import { expect, test, type Page } from '@playwright/test';

import { Container } from '../../../pom/editor/Container';
import { Editor } from '../../../pom/editor/Editor';
import { DEFAULT_TEST_USER } from '../../../fixtures/auth';
import SeedClient from '../../../api/SeedClient';

const REPOSITORY_NAME = 'Editor test repository';
const COMMENT_CONTENT = 'Content element test comment';
const OTHER_AUTHOR_COMMENT = 'Comment authored by another user';

// Seeds a repository with a single element comment and opens its editor.
const seedElementComment = async (
  page: Page,
  comment: { content: string; authorEmail?: string },
) => {
  await SeedClient.resetDatabase();
  const { data } = await SeedClient.seedTestRepository({
    name: REPOSITORY_NAME,
  });
  const { id: activityId, repositoryId } = data.activity;
  await SeedClient.seedComment({
    repositoryId,
    activityId,
    contentElementId: data.contentElement.id,
    ...comment,
  });
  await page.goto(`/repository/${repositoryId}/editor/${activityId}`);
  await page.waitForLoadState('networkidle');
};

test.describe('an element comment authored by the current user', () => {
  test.beforeEach(({ page }) =>
    seedElementComment(page, { content: COMMENT_CONTENT }),
  );

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
    await expect(page.getByText('This comment was deleted')).toBeVisible();
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

  test('editing an element comment keeps the flyout open', async ({ page }) => {
    const editor = new Editor(page);
    const element = await editor.getElement('The Origins of Pizza');
    const comment = await element.getComment(COMMENT_CONTENT);
    await comment.toggleEdit();
    // Wait out any regressed close animation first; a flyout mid-close would
    // still satisfy toBeVisible and pass falsely.
    await page.waitForTimeout(1500);
    await expect(element.commentsMenu).toBeVisible();
    await expect(comment.editor).toBeVisible();
  });
});

test.describe('a comment authored by another user', () => {
  test.beforeEach(({ page }) =>
    seedElementComment(page, {
      content: OTHER_AUTHOR_COMMENT,
      authorEmail: DEFAULT_TEST_USER.email,
    }),
  );

  test('can be resolved by a non-author', async ({ page }) => {
    const editor = new Editor(page);
    const element = await editor.getElement('The Origins of Pizza');
    const comment = await element.getComment(OTHER_AUTHOR_COMMENT);
    await comment.resolve();
    // Make sure changes are persisted
    await page.reload();
    await element.openComments();
    await expect(page.getByText('Marked as resolved')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Undo' })).toBeVisible();
  });

  test('cannot be edited or removed by a non-author', async ({ page }) => {
    const editor = new Editor(page);
    const element = await editor.getElement('The Origins of Pizza');
    const comment = await element.getComment(OTHER_AUTHOR_COMMENT);
    await comment.openActions();
    await expect(comment.resolveBtn).toBeVisible();
    await expect(comment.editBtn).not.toBeVisible();
    await expect(comment.removeBtn).not.toBeVisible();
  });
});

test.afterAll(async () => {
  await SeedClient.resetDatabase();
});
