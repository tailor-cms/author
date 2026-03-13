import { expect, test } from '@playwright/test';

import BaseClient from '../../../api/BaseClient';
import { ContainerList } from '../../../pom/editor/ContainerList';
import { ContentElement } from '../../../pom/editor/ContentElement';
import { Editor } from '../../../pom/editor/Editor';
import { EditorToolbar } from '../../../pom/editor/EditorToolbar';
import { RevisionHistory } from '../../../pom/repository/RevisionHistory';
import SeedClient from '../../../api/SeedClient';
import { Toast } from '../../../pom/common/Toast';
import {
  outlineSeed,
  toEditorPage,
  seedLinkedRepositories,
  toSeededRepository,
} from '../../../helpers/seed';

const api = new BaseClient('/api/repositories/');

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

test('source element edit propagates to linked copy', async ({ browser }) => {
  const context = await browser.newContext({
    storageState: '.auth-admin.json',
  });
  const sourcePage = await context.newPage();
  const targetPage = await context.newPage();
  try {
    const { activity, linkedActivity } = await seedLinkedRepositories();
    await toEditorPage(sourcePage, activity);
    const sourceEditor = new Editor(sourcePage);
    const sourceElement = sourceEditor.getHtmlElement();
    // Edit the source element content
    const updatedContent = 'Updated content';
    await sourceElement.fill(updatedContent);
    // Click another element to blur tiptap and trigger save
    await sourcePage.locator(ContentElement.selector).nth(1).click();
    await new Toast(sourcePage).isSaved();
    // Verify propagation on target
    await targetPage.goto(
      `/repository/${linkedActivity.repositoryId}/editor/${linkedActivity.id}`,
    );
    await targetPage.waitForLoadState('networkidle');
    const targetElement = targetPage.locator(ContentElement.selector).first();
    await expect(targetElement).toContainText(updatedContent);
  } finally {
    await context.close();
  }
});

test('element creation propagates to linked copy', async ({ browser }) => {
  const context = await browser.newContext({
    storageState: '.auth-admin.json',
  });
  try {
    const sourcePage = await context.newPage();
    const targetPage = await context.newPage();
    const { activity, linkedActivity } = await seedLinkedRepositories();
    await toEditorPage(sourcePage, activity);
    const sourceEditor = new Editor(sourcePage);
    const sourceElements = sourcePage.locator(ContentElement.selector);
    const sourceInitialCount = await sourceElements.count();
    await toEditorPage(targetPage, linkedActivity);
    const targetInitialCount = await targetPage
      .locator(ContentElement.selector)
      .count();
    await sourceEditor.addElementDialog.add('HTML');
    await expect(sourceElements).toHaveCount(sourceInitialCount + 1);
    await targetPage.reload();
    await expect(new ContainerList(targetPage).el.first()).toBeVisible();
    expect(await targetPage.locator(ContentElement.selector).count()).toBe(
      targetInitialCount + 1,
    );
  } finally {
    await context.close();
  }
});

test('element deletion propagates to linked copy', async ({ browser }) => {
  const context = await browser.newContext({
    storageState: '.auth-admin.json',
  });
  const sourcePage = await context.newPage();
  const targetPage = await context.newPage();
  try {
    const { activity, linkedActivity } = await seedLinkedRepositories();
    await toEditorPage(sourcePage, activity);
    const sourceEditor = new Editor(sourcePage);
    const sourceElements = sourcePage.locator(ContentElement.selector);
    const sourceInitialCount = await sourceElements.count();
    await toEditorPage(targetPage, linkedActivity);
    const targetInitialCount = await targetPage
      .locator(ContentElement.selector)
      .count();
    expect(targetInitialCount).toBeGreaterThan(0);
    const element = sourceEditor.getElement();
    await element.remove();
    await expect(sourceElements).toHaveCount(sourceInitialCount - 1);
    await targetPage.reload();
    await expect(new ContainerList(targetPage).el.first()).toBeVisible();
    expect(await targetPage.locator(ContentElement.selector).count()).toBe(
      targetInitialCount - 1,
    );
  } finally {
    await context.close();
  }
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

test('reordering individually linked element keeps it linked', async ({
  page,
}) => {
  // Create a repository with an individually linked element
  const { activity } = await toSeededRepository(page);
  await toEditorPage(page, activity);
  const editor = new Editor(page);
  await editor.toSecondaryPage();
  // Link an element from the primary page (individual link, not via activity)
  const linkDialog = await editor.addElementDialog.openLinkDialog();
  await linkDialog.select(
    outlineSeed.primaryPage.title,
    outlineSeed.primaryPage.textContent,
  );
  await new Toast(page).isSaved();
  // Add another element so we have something to reorder against
  await editor.addElementDialog.add('HTML');
  await new Toast(page).isSaved();
  // Reorder via API
  const targetRepoId = activity.repositoryId;
  const { data: allElements } = await api.get(
    `${targetRepoId}/content-elements/`,
  );
  const linkedElement = allElements.find(
    (el: any) => el.repositoryId === targetRepoId && el.isLinkedCopy,
  );
  expect(linkedElement).toBeDefined();
  await api.post(
    `${targetRepoId}/content-elements/${linkedElement.id}/reorder`,
    { position: 1 },
  );
  // Reload and verify element is still linked
  await page.reload({ waitUntil: 'networkidle' });
  const element = editor.getElement(outlineSeed.primaryPage.textContent);
  await element.expectLinked();
});

test('linking content element creates "Linked" revision', async ({ page }) => {
  const { activity, repository } = await toSeededRepository(page);
  await toEditorPage(page, activity);
  const editor = new Editor(page);
  await editor.toSecondaryPage();
  // Link an element from the primary page (individual link)
  const linkDialog = await editor.addElementDialog.openLinkDialog();
  await linkDialog.select(
    outlineSeed.primaryPage.title,
    outlineSeed.primaryPage.textContent,
  );
  await new Toast(page).isSaved();
  // Navigate to history page and verify "Linked" revision
  const history = await RevisionHistory.goTo(page, repository.id);
  await history.expectRevisionExists('Linked tiptap html element');
});

test.afterAll(async () => {
  await SeedClient.resetDatabase();
});
