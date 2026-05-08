import { expect, test } from '@playwright/test';

import { Editor } from '../../../pom/editor/Editor';
import { EditorToolbar } from '../../../pom/editor/EditorToolbar';
import SeedClient from '../../../api/SeedClient';
import { Toast } from '../../../pom/common/Toast';
import {
  outlineSeed,
  seedLinkedRepositories,
  toSeededRepository,
} from '../../../helpers/seed';
import { toEditorPage } from '../../../helpers/navigation';

test.beforeEach(async () => {
  await SeedClient.resetDatabase();
});

test('can link a content element via add element dialog', async ({ page }) => {
  const { activity } = await toSeededRepository(page);
  await toEditorPage(page, activity);
  const editor = new Editor(page);
  await editor.toSecondaryPage();
  // Open add element drawer and link content from the primary page
  const linkDialog = await editor.addElementDialog.openLinkDialog();
  await linkDialog.select(
    outlineSeed.primaryPage.title,
    outlineSeed.primaryPage.textContent,
  );
  await new Toast(page).isSaved();
  // Verify linked element appears and is marked as linked
  const element = editor.getElement(outlineSeed.primaryPage.textContent);
  await expect(element.el).toBeVisible();
  await element.expectLinked();
  await element.el.hover();
  await expect(element.linkedIndicatorBtn).toBeVisible();
  await expect(element.commentDisabledBtn).toBeVisible();
  // Verify persistence
  await page.reload({ waitUntil: 'networkidle' });
  const reloadedElement = editor.getElement(
    outlineSeed.primaryPage.textContent,
  );
  await expect(reloadedElement.el).toBeVisible();
  await reloadedElement.expectLinked();
});

test('linked element shows linked indicator', async ({ page }) => {
  const { activity } = await toSeededRepository(page);
  await toEditorPage(page, activity);
  const editor = new Editor(page);
  await editor.toSecondaryPage();
  const linkDialog = await editor.addElementDialog.openLinkDialog();
  await linkDialog.select(
    outlineSeed.primaryPage.title,
    outlineSeed.primaryPage.textContent,
  );
  await new Toast(page).isSaved();
  const element = editor.getElement(outlineSeed.primaryPage.textContent);
  await expect(element.el).toBeVisible();
  await element.expectLinked();
  await element.el.hover();
  await expect(element.linkedIndicatorBtn).toBeVisible();
});

test('comments disabled on linked element', async ({ page }) => {
  const { activity } = await toSeededRepository(page);
  await toEditorPage(page, activity);
  const editor = new Editor(page);
  await editor.toSecondaryPage();
  const linkDialog = await editor.addElementDialog.openLinkDialog();
  await linkDialog.select(
    outlineSeed.primaryPage.title,
    outlineSeed.primaryPage.textContent,
  );
  await new Toast(page).isSaved();
  const element = editor.getElement(outlineSeed.primaryPage.textContent);
  await element.expectLinked();
  await element.el.hover();
  await expect(element.commentDisabledBtn).toBeVisible();
  await element.openCommentDisabledMenu();
  await expect(
    page.getByText('Comments are only available on the source element'),
  ).toBeVisible();
});

test('editing individually linked element triggers unlink confirmation', async ({
  page,
}) => {
  // Create a repository with an individually linked element (not via activity)
  const { activity } = await toSeededRepository(page);
  await toEditorPage(page, activity);
  const editor = new Editor(page);
  await editor.toSecondaryPage();
  // Link an element from the primary page
  const linkDialog = await editor.addElementDialog.openLinkDialog();
  await linkDialog.select(
    outlineSeed.primaryPage.title,
    outlineSeed.primaryPage.textContent,
  );
  await new Toast(page).isSaved();
  const element = editor.getHtmlElement(outlineSeed.primaryPage.textContent);
  await element.expectLinked();
  // Edit the individually linked element
  await element.fill(' edited');
  await editor.sidebar.el.click();
  const dialog = page.locator('div[role="dialog"]', {
    hasText: 'Edit linked element',
  });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'confirm' }).click();
  await new Toast(page).isSaved();
  // Verify element is no longer linked after unlink
  await page.waitForTimeout(1000);
  await page.reload({ waitUntil: 'networkidle' });
  const updatedElement = editor.getElement(outlineSeed.primaryPage.textContent);
  await updatedElement.expectNotLinked();
});

test('source usages display on source element', async ({ page }) => {
  const { activity } = await seedLinkedRepositories();
  await toEditorPage(page, activity);
  const editor = new Editor(page);
  const element = editor.getElement();
  const menu = await element.openSourceUsagesMenu();
  await menu.expectHasUsages();
});

test('comments restore after unlink', async ({ page }) => {
  const { linkedActivity } = await seedLinkedRepositories();
  await toEditorPage(page, linkedActivity);
  const toolbar = new EditorToolbar(page);
  // Unlink from editor toolbar
  await toolbar.unlink();
  // Comments should be available after unlink
  const editor = new Editor(page);
  const element = editor.getElement();
  await element.el.hover();
  await expect(element.commentPopoverToggle).toBeVisible();
  await expect(element.commentDisabledBtn).not.toBeVisible();
});

test('nested linked elements do not show unlink action', async ({ page }) => {
  const { linkedActivity } = await seedLinkedRepositories();
  await toEditorPage(page, linkedActivity);
  const editor = new Editor(page);
  const element = editor.getElement();
  await element.expectLinked();
  // Element actions are hidden on disabled editor (activity-linked);
  // unlink is only available at the toolbar level
  await element.el.hover();
  await expect(element.linkedIndicatorBtn).not.toBeVisible();
});

test.afterAll(async () => {
  await SeedClient.resetDatabase();
});
