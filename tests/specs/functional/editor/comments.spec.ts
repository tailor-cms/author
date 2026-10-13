import { expect, test, type Page } from '@playwright/test';

import type { ContentElement } from '../../../pom/editor/ContentElement';
// The other person in these tests
import { DEFAULT_TEST_USER as TEAMMATE } from '../../../fixtures/auth';
import { Editor } from '../../../pom/editor/Editor';
import { IMAGE } from '../../../fixtures/assets';
import SeedClient from '../../../api/SeedClient';
import { toEditorPage } from '../../../helpers/navigation';
import { outlineSeed } from '../../../helpers/seed';

const YOUR_COMMENT = 'A comment of your own';
const TEAMMATE_COMMENT = 'A comment from a teammate';

// Where is the seeded comment
interface Anchor {
  repositoryId: number;
  activityId: number;
  contentElementId: number;
}

// Seeds a repository with one element comment and opens it in the editor
const seedElementComment = async (
  page: Page,
  comment: { content: string; authorEmail?: string },
) => {
  const { data } = await SeedClient.seedTestRepository({
    name: 'Editor test repository',
  });
  const anchor: Anchor = {
    repositoryId: data.activity.repositoryId,
    activityId: data.activity.id,
    contentElementId: data.contentElement.id,
  };
  await SeedClient.seedComment({ ...anchor, ...comment });
  await toEditorPage(page, data.activity);
  const { elementText } = outlineSeed.primaryPage;
  const element = new Editor(page).getElement(elementText);
  return { anchor, element };
};

// Each test seeds its own repository, so one reset per file is enough
test.beforeAll(async () => {
  await SeedClient.resetDatabase();
});

test.describe('your own comment', () => {
  let anchor: Anchor;
  let element: ContentElement;

  test.beforeEach(async ({ page }) => {
    const seeded = await seedElementComment(page, { content: YOUR_COMMENT });
    ({ anchor, element } = seeded);
  });

  test('posts a comment on an element', async ({ page }) => {
    const text = 'This is a test comment';
    await element.postComment(text);
    await page.reload();
    await element.openComments();
    await expect(element.comments.getComment(text).el).toBeVisible();
  });

  test('reacts to a comment, and adds a second reaction', async ({ page }) => {
    const comment = await element.getComment(YOUR_COMMENT);
    const { pills } = comment.reactions;
    await comment.react('thumbsup');
    await expect(pills).toHaveCount(1);
    await expect(pills).toContainText('1');
    await comment.reactions.add('tada');
    await expect(pills).toHaveCount(2);
    await page.reload();
    await element.openComments();
    await expect(pills).toHaveCount(2);
  });

  test('mentions somebody in a comment', async () => {
    await element.openComments();
    const { composer } = element.comments;
    await composer.selectSuggestion('@', { query: 'admin' });
    await composer.send();
    const comment = element.comments.getLastComment();
    await expect(comment.body.tokens.first()).toBeVisible();
  });

  test('attaches a file to a comment', async () => {
    await element.openComments();
    const { composer } = element.comments;
    await composer.attach(IMAGE.path);
    await composer.send();
    // A comment that is only an image shows the image, not its name
    const comment = element.comments.getLastComment();
    await expect(comment.previews.image).toBeVisible();
  });

  test('edits a comment via different methods', async ({ page }) => {
    const edited = 'This is a test comment edited';
    await (await element.getComment(YOUR_COMMENT)).edit(edited);
    await page.reload();
    await element.openComments();
    const comment = element.comments.getComment(edited);
    await expect(comment.body.editedLabel).toBeVisible();
    await expect(element.comments.getComment(YOUR_COMMENT).el)
      .not.toBeVisible();
    await element.comments.editLast();
    const again = 'Edited again without the mouse';
    await comment.editor.save(again);
    await expect(element.comments.getComment(again).el).toBeVisible();
  });

  test('comments stay open while editing one', async ({ page }) => {
    const comment = await element.getComment(YOUR_COMMENT);
    await comment.startEdit();
    // Comments that are closing still count as visible, so give them time
    await page.waitForTimeout(1500);
    await expect(element.commentsMenu).toBeVisible();
  });

  test('saving an empty edit does not delete the comment', async () => {
    const comment = await element.getComment(YOUR_COMMENT);
    await comment.startEdit();
    await comment.editor.save('');
    await expect(comment.el).toBeVisible();
  });

  test('removes a comment, hiding Resolve All with it', async ({ page }) => {
    const comment = await element.getComment(YOUR_COMMENT);
    await comment.remove();
    await expect(element.commentsMenu).toBeVisible();
    await expect(element.comments.resolveAllBtn).not.toBeVisible();
    await page.reload();
    await element.openComments();
    await expect(element.comments.getLastComment().el)
      .toContainText('This comment was deleted');
  });

  test('resolves all comments at once', async ({ page }) => {
    await element.postComment('Second test comment');
    await element.comments.resolveAll();
    await page.reload();
    await element.openComments();
    await expect(page.getByText('Marked as resolved')).toHaveCount(2);
  });

  test('shows the latest five, and the rest on request', async ({ page }) => {
    for (let i = 1; i <= 6; i++) {
      await SeedClient.seedComment({ ...anchor, content: `Follow-up ${i}` });
    }
    await page.reload();
    await element.openComments();
    const { rows, showMoreBtn } = element.comments;
    await expect(rows).toHaveCount(5);
    await showMoreBtn.click();
    await expect(rows).toHaveCount(7);
    await expect(showMoreBtn).toHaveText('Show less');
  });

  test('flags comments left since the last visit', async ({ page }) => {
    const { unseenDivider, composer } = element.comments;
    // The first visit records how far the user has read
    await element.openComments();
    await expect(composer.input).toBeFocused();
    await page.keyboard.press('Escape');
    await SeedClient.seedComment({
      ...anchor,
      content: 'Since you left',
      authorEmail: TEAMMATE.email,
    });
    await page.reload();
    await element.openComments();
    await expect(unseenDivider).toContainText('1 new comment');
    // Opening moves focus to the composer, which marks the new one as seen
    await expect(composer.input).toBeFocused();
    await expect(unseenDivider).toHaveCount(0);
  });

  test('posts a page comment from the sidebar', async ({ page }) => {
    const { sidebar } = new Editor(page);
    const text = 'A note on the page as a whole';
    await sidebar.openCommentsTab();
    await sidebar.comments.post(text);
    // Saved on the page, not on an element
    await page.reload();
    await sidebar.openCommentsTab();
    await expect(sidebar.comments.getComment(text).el).toBeVisible();
  });
});

test.describe(`a teammate's comment`, () => {
  let element: ContentElement;

  test.beforeEach(async ({ page }) => {
    ({ element } = await seedElementComment(page, {
      content: TEAMMATE_COMMENT,
      authorEmail: TEAMMATE.email,
    }));
  });

  test('can be resolved by anyone', async ({ page }) => {
    await (await element.getComment(TEAMMATE_COMMENT)).resolve();
    await page.reload();
    const comment = await element.getComment(TEAMMATE_COMMENT);
    await expect(comment.resolvedNote).toBeVisible();
  });

  test('can be edited or removed only by its author', async () => {
    const comment = await element.getComment(TEAMMATE_COMMENT);
    await comment.openMenu();
    await expect(comment.getMenuItemLocator('Resolve')).toBeVisible();
    await expect(comment.getMenuItemLocator('Edit')).not.toBeVisible();
    await expect(comment.getMenuItemLocator('Remove')).not.toBeVisible();
  });
});

test.afterAll(async () => {
  await SeedClient.resetDatabase();
});
