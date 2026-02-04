import { expect, test } from '@playwright/test';

import { ActivityOutline } from '../../../pom/repository/Outline';
import { ContainerList } from '../../../pom/editor/ContainerList';
import { ContentElement } from '../../../pom/editor/ContentElement';
import { Editor } from '../../../pom/editor/Editor';
import SeedClient from '../../../api/SeedClient';
import {
  toEditorPage,
  toLinkedRepositories,
  toStructurePage,
} from '../../../helpers/seed';

test.beforeEach(async () => {
  await SeedClient.resetDatabase();
});

test('linked element shows linked indicator', async ({ page }) => {
  const { linkedActivity } = await toLinkedRepositories();
  await toEditorPage(page, linkedActivity);
  const editor = new Editor(page);
  const element = editor.getElement();
  await expect(element.el).toBeVisible();
  await element.expectLinked();
  await element.el.hover();
  await expect(element.linkedIndicatorBtn).toBeVisible();
});

test('comments disabled on linked element', async ({ page }) => {
  const { linkedActivity } = await toLinkedRepositories();
  await toEditorPage(page, linkedActivity);
  const editor = new Editor(page);
  const element = editor.getElement();
  await element.el.hover();
  await expect(element.commentDisabledBtn).toBeVisible();
  await element.openCommentDisabledMenu();
  await expect(
    page.getByText('Comments are only available on the source element'),
  ).toBeVisible();
});

test('editing linked element triggers detach confirmation', async ({
  page,
}) => {
  const { linkedActivity } = await toLinkedRepositories();
  await toEditorPage(page, linkedActivity);
  const editor = new Editor(page);
  const element = editor.getHtmlElement();
  await element.fill('Edited content');
  await editor.sidebar.el.click();
  const dialog = page.locator('div[role="dialog"]', {
    hasText: 'Edit linked element',
  });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'confirm' }).click();
  await expect(page.locator('.v-snackbar')).toContainText('saved');
  // Verify element is no longer linked after detach
  await page.waitForTimeout(1000);
  await page.reload();
  await page.waitForLoadState('networkidle');
  const updatedElement = editor.getElement();
  await updatedElement.expectNotLinked();
});

test('source element edit propagates to linked copy', async ({ browser }) => {
  const context = await browser.newContext({
    storageState: '.auth-admin.json',
  });
  const sourcePage = await context.newPage();
  const targetPage = await context.newPage();
  try {
    const { activity, linkedActivity } = await toLinkedRepositories();
    await toEditorPage(sourcePage, activity);
    const sourceEditor = new Editor(sourcePage);
    const sourceElement = sourceEditor.getHtmlElement();
    // Edit the source element content
    const updatedContent = 'Updated content';
    await sourceElement.fill(updatedContent);
    // Click another element to blur tiptap and trigger save
    await sourcePage.locator(ContentElement.selector).nth(1).click();
    await expect(sourcePage.locator('.v-snackbar')).toHaveText('Element saved');
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
    const { activity, linkedActivity } = await toLinkedRepositories();
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
    const { activity, linkedActivity } = await toLinkedRepositories();
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
  const { activity } = await toLinkedRepositories();
  await toEditorPage(page, activity);
  const editor = new Editor(page);
  const element = editor.getElement();
  const menu = await element.openSourceUsagesMenu();
  await menu.expectHasUsages();
});

test('comments restore after unlink', async ({ page }) => {
  const { linkedActivity } = await toLinkedRepositories();
  // Navigate to structure and unlink
  await toStructurePage(page, linkedActivity);
  const outline = new ActivityOutline(page);
  const { sidebar } = await outline.expandAndSelect(linkedActivity.uid);
  const indicator = sidebar.linkedIndicator;
  await indicator.expectVisible();
  await indicator.unlink();
  // Navigate to editor — comments should be available again
  await toEditorPage(page, linkedActivity);
  const editor = new Editor(page);
  const element = editor.getElement();
  await element.el.hover();
  await expect(element.commentPopoverToggle).toBeVisible();
  await expect(element.commentDisabledBtn).not.toBeVisible();
});

test('nested linked elements do not show unlink action', async ({ page }) => {
  const { linkedActivity } = await toLinkedRepositories();
  await toEditorPage(page, linkedActivity);
  const editor = new Editor(page);
  const element = editor.getElement();
  const menu = await element.openLinkedMenu();
  await menu.expectNoUnlinkAction();
  await menu.expectViewSourceAction();
});

test.afterAll(async () => {
  await SeedClient.resetDatabase();
});
