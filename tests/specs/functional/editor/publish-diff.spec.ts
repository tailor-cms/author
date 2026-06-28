import { expect, test } from '@playwright/test';

import { Editor } from '../../../pom/editor/Editor';
import { EditorToolbar } from '../../../pom/editor/EditorToolbar';
import SeedClient from '../../../api/SeedClient';

test.beforeEach(async ({ page }) => {
  await SeedClient.resetDatabase();
  const { data } = await SeedClient.seedTestRepository({});
  const { id, repositoryId } = data.activity;
  await page.goto(`/repository/${repositoryId}/editor/${id}`);
  await page.waitForLoadState('networkidle');
});

test.afterAll(async () => {
  await SeedClient.resetDatabase();
});

test('flags elements added, changed, and removed since publish', async ({
  page,
}) => {
  const editor = new Editor(page);
  const toolbar = new EditorToolbar(page);
  await editor.toSecondaryPage();
  await editor.addContentElement('First element');
  await editor.addContentElement('Second element');
  await editor.addContentElement('Third element');

  await toolbar.publish();

  await editor.getHtmlElement('Second element').type(' edited');
  await editor.commitElementEdit();
  await editor.getHtmlElement('Third element').remove();
  await editor.addContentElement('Fourth element');

  await toolbar.compareWithPublished();

  await expect(editor.getHtmlElement('First element').diffChip).toHaveCount(0);
  await expect(editor.getHtmlElement('Second element').diffChip).toHaveText('changed');
  await expect(editor.getHtmlElement('Fourth element').diffChip).toHaveText('new');
  await expect(editor.getHtmlElement('Third element').diffChip).toHaveText('removed');
});

test('does not flag an element saved with identical content', async ({
  page,
}) => {
  const editor = new Editor(page);
  const toolbar = new EditorToolbar(page);
  await editor.toSecondaryPage();
  await editor.addContentElement('Stable');

  await toolbar.publish();

  // Net-zero edit: two real saves that leave the content identical.
  const element = editor.getHtmlElement('Stable');
  await element.fill('Stable edited');
  await editor.commitElementEdit();
  await element.fill('Stable');
  await editor.commitElementEdit();

  await toolbar.compareWithPublished();

  await expect(element.diffChip).toHaveCount(0);
});
