import { expect, test } from '@playwright/test';

import { Editor } from '../../../pom/editor/Editor';
import { EditorHistory } from '../../../pom/editor/History';
import { expectAlert } from '../../../pom/common/utils';
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

test('previews a past version read-only and returns to the live state', async ({
  page,
}) => {
  const editor = new Editor(page);
  await editor.toSecondaryPage();
  await editor.addContentElement('First version');
  await editor.getHtmlElement('First version').remove();
  await expect(page.getByText('First version')).toBeHidden();

  const history = new EditorHistory(page);
  await history.open();
  await history.preview(`Updated ${editor.primaryElementLabel} element`);

  await expect(history.toolbar).toContainText('Viewing version from');
  await expect(history.restoreBtn).toBeVisible();
  await expect(page.getByText('First version')).toBeVisible();

  await history.exit();
  await expect(page.getByText('First version')).toBeHidden();
});

test('restores a previous version', async ({ page }) => {
  const editor = new Editor(page);
  await editor.toSecondaryPage();
  await editor.addContentElement('Restore me please');
  await editor.getHtmlElement('Restore me please').remove();
  await expect(page.getByText('Restore me please')).toBeHidden();

  const history = new EditorHistory(page);
  await history.open();
  await history.preview(`Updated ${editor.primaryElementLabel} element`);
  await history.restore();
  await expectAlert(page, 'Activity restored');

  await page.reload();
  await page.waitForLoadState('networkidle');
  await editor.toSecondaryPage();
  await expect(page.getByText('Restore me please')).toBeVisible();
});

test('preview flags content changed from the previous version', async ({
  page,
}) => {
  const editor = new Editor(page);
  await editor.toSecondaryPage();
  await editor.addContentElement('Original');
  await editor.getHtmlElement('Original').fill('Updated');
  await editor.commitElementEdit();

  const history = new EditorHistory(page);
  await history.open();
  await history.preview(`Updated ${editor.primaryElementLabel} element`);

  await expect(editor.getHtmlElement('Updated').diffChip).toHaveText('changed');
});
