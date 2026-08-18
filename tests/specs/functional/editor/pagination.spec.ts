import { expect, test } from '@playwright/test';

import { Editor } from '../../../pom/editor/Editor';
import { EditorToolbar } from '../../../pom/editor/EditorToolbar';
import { ENTITY, toCollection } from '../collection/helpers';
import { outlineSeed } from '../../../helpers/seed';
import SeedClient from '../../../api/SeedClient';

const REPOSITORY_NAME = 'Pagination test repository';

test.describe('Editor pagination', () => {
  let editor: Editor;
  let toolbar: EditorToolbar;

  test.beforeEach(async ({ page }) => {
    await SeedClient.resetDatabase();
    const { data } = await SeedClient.seedTestRepository({
      name: REPOSITORY_NAME,
    });
    const { id: activityId, repositoryId } = data.activity;
    await page.goto(`/repository/${repositoryId}/editor/${activityId}`);
    await page.waitForLoadState('networkidle');
    editor = new Editor(page);
    toolbar = new EditorToolbar(page);
  });

  test.afterAll(async () => {
    await SeedClient.resetDatabase();
  });

  test('pages through the outline in sidebar order', async () => {
    const { navigation } = editor.sidebar;
    await navigation.expandAll();
    const titles = await navigation.getOutlineTitles();
    const start = titles.indexOf(editor.primaryPageName);
    expect(start).toBeGreaterThan(-1);
    for (const title of titles.slice(start + 1)) {
      await toolbar.toNextActivity();
      await expect(toolbar.title).toContainText(title);
    }
  });

  test('disables the controls at both ends of the outline', async () => {
    const { navigation } = editor.sidebar;
    await navigation.expandAll();
    const titles = await navigation.getOutlineTitles();

    expect(titles.length).toBeGreaterThan(1);
    const first = titles[0];
    const last = titles[titles.length - 1];

    await navigation.navigateTo(first);
    await expect(toolbar.title).toContainText(first);
    await toolbar.expectAtSequenceStart();

    await navigation.navigateTo(last);
    await expect(toolbar.title).toContainText(last);
    await toolbar.expectAtSequenceEnd();
  });

  test('pager names both neighbours and navigates', async () => {
    const { navigation } = editor.sidebar;
    await navigation.expandAll();
    // Expected names come from the sidebar; taking them from the toolbar would
    // only prove the two controls agree.
    const titles = await navigation.getOutlineTitles();
    const start = titles.indexOf(editor.primaryPageName);
    expect(titles.length).toBeGreaterThan(start + 2);
    const previous = titles[start];
    const current = titles[start + 1];
    const next = titles[start + 2];

    // Land one activity in, so there is a neighbour on either side.
    await toolbar.toNextActivity();
    await editor.pager.expectNeighbours({ previous, next });

    await editor.pager.toNext();
    await expect(toolbar.title).toContainText(next);

    await editor.pager.toPrevious();
    await expect(toolbar.title).toContainText(current);
  });

  test('Alt+ArrowDown pages, but not while editing text', async ({ page }) => {
    // Focusing an element records it in the query, so only the path tells us
    // whether the activity moved.
    const activityPath = new URL(page.url()).pathname;
    const samePath = new RegExp(`${activityPath}(\\?|$)`);
    await editor.focusElement(editor.primaryPageContent);
    await page.keyboard.press('Alt+ArrowDown');
    await expect(page).toHaveURL(samePath);

    // Reopening without `elementId` leaves the focus on the document, where
    // paging applies.
    await page.goto(activityPath);
    await page.waitForLoadState('networkidle');
    const next = await toolbar.nextActivityName();
    await page.keyboard.press('Alt+ArrowDown');
    await expect(toolbar.title).toContainText(next);
    await expect(page).not.toHaveURL(samePath);
  });

  test('reveals the target inside a collapsed group', async () => {
    const { navigation } = editor.sidebar;
    await navigation.navigateTo(outlineSeed.group.title);
    await expect(toolbar.title).toContainText(outlineSeed.group.title);
    await navigation.collapseAll();

    const child = await toolbar.nextActivityName();
    await expect(navigation.outlineItem(child)).toBeHidden();

    await toolbar.toNextActivity();
    await expect(navigation.outlineItem(child)).toBeVisible();
  });
});

test.describe('Editor pagination - collections', () => {
  test.afterAll(async () => {
    await SeedClient.resetDatabase();
  });

  test('is absent for collection items', async ({ page }) => {
    const { collection } = await toCollection(page);
    await collection.createFirstItem(ENTITY.AUTHOR, 'Jane Doe');
    const editor = new Editor(page);
    const toolbar = new EditorToolbar(page);
    await toolbar.expectNoPagination();
    await editor.pager.expectHidden();
  });
});
