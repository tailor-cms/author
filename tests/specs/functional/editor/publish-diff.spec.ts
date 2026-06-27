import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

import { Editor } from '../../../pom/editor/Editor';
import SeedClient from '../../../api/SeedClient';

const COMPARE = 'Compare with published';

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

const publishCurrentActivity = async (page: Page) => {
  await page.getByRole('button', { name: 'Publish', exact: true }).click();
  const dialog = page.locator('div[role="dialog"]');
  await dialog.getByRole('button', { name: 'confirm' }).click();
  await expect(page.getByRole('button', { name: COMPARE })).toBeEnabled({
    timeout: 20000,
  });
  await expect(dialog).toBeHidden();
};

test('flags elements added, changed, and removed since publish', async ({
  page,
}) => {
  const editor = new Editor(page);
  await editor.toSecondaryPage();
  await editor.addContentElement('First element');
  await editor.addContentElement('Second element');
  await editor.addContentElement('Third element');

  await publishCurrentActivity(page);

  await editor.getHtmlElement('Second element').type(' edited');
  await editor.commitElementEdit();
  await editor.getHtmlElement('Third element').remove();
  await editor.addContentElement('Fourth element');

  await page.getByRole('button', { name: COMPARE }).click();

  await expect(editor.getHtmlElement('First element').diffChip).toHaveCount(0);
  await expect(editor.getHtmlElement('Second element').diffChip).toHaveText('changed');
  await expect(editor.getHtmlElement('Fourth element').diffChip).toHaveText('new');
  await expect(editor.getHtmlElement('Third element').diffChip).toHaveText('removed');
});

test('does not flag an element saved with identical content', async ({
  page,
}) => {
  const editor = new Editor(page);
  await editor.toSecondaryPage();
  await editor.addContentElement('Stable');

  await publishCurrentActivity(page, editor);

  // Net-zero edit: two real saves that leave the content identical.
  const element = editor.getHtmlElement('Stable');
  await element.fill('Stable edited');
  await editor.commitElementEdit();
  await element.fill('Stable');
  await editor.commitElementEdit();

  await page.getByRole('button', { name: COMPARE }).click();

  await expect(element.diffChip).toHaveCount(0);
});
