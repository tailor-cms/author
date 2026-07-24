import { expect, test } from '@playwright/test';

import BaseClient from '../../../api/BaseClient';
import { ContainerList } from '../../../pom/editor/ContainerList';
import { ContentElement } from '../../../pom/editor/ContentElement';
import { Editor } from '../../../pom/editor/Editor';
import { RevisionHistory } from '../../../pom/repository/RevisionHistory';
import SeedClient from '../../../api/SeedClient';
import { Toast } from '../../../pom/common/Toast';
import {
  outlineSeed,
  seedLinkedRepositories,
  toSeededRepository,
} from '../../../helpers/seed';
import { toEditorPage } from '../../../helpers/navigation';

const api = new BaseClient('/api/repositories/');
const { primaryPage: seed } = outlineSeed;

test.beforeEach(async () => {
  await SeedClient.resetDatabase();
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
  await linkDialog.select(seed.title, seed.textContent);
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
  const element = editor.getElement(seed.textContent);
  await element.expectLinked();
});

test('source element edit preserves linked copy positions', async ({
  page,
}) => {
  const { activity } = await toSeededRepository(page);
  const repositoryId = activity.repositoryId;
  await toEditorPage(page, activity);
  const editor = new Editor(page);
  await editor.toSecondaryPage();
  // Occupy a low position so linked copies land at higher positions than
  // their sources — ensuring the test catches position overwrites.
  const toast = new Toast(page);
  await editor.addElementDialog.add('HTML');
  await toast.isSaved();
  // Link all primary page elements into the secondary page
  const linkDialog = await editor.addElementDialog.openLinkDialog();
  await linkDialog.select(seed.title);
  await toast.isSaved();
  const { data: before } = await api.get(`${repositoryId}/content-elements/`);
  const copies = before
    .filter((el: any) => el.isLinkedCopy)
    .sort((a: any, b: any) => a.position - b.position);
  expect(copies.length).toBeGreaterThanOrEqual(2);
  for (const copy of copies) {
    const source = before.find((el: any) => el.id === copy.sourceId);
    expect(copy.position).not.toBe(source.position);
  }
  // Edit source on the primary page - triggers propagation to copies
  await editor.toPrimaryPage();
  await editor.getHtmlElement(seed.textContent).type(' updated');
  await editor.sidebar.el.click();
  await toast.isSaved();
  await page.waitForTimeout(1000);
  // Positions must remain unchanged after propagation
  const { data: after } = await api.get(`${repositoryId}/content-elements/`);
  for (const { id, position } of copies) {
    expect(after.find((el: any) => el.id === id).position).toBe(position);
  }
});

test('linking content element creates "Linked" revision', async ({ page }) => {
  const { activity, repository } = await toSeededRepository(page);
  await toEditorPage(page, activity);
  const editor = new Editor(page);
  await editor.toSecondaryPage();
  // Link an element from the primary page (individual link)
  const linkDialog = await editor.addElementDialog.openLinkDialog();
  await linkDialog.select(seed.title, seed.textContent);
  await new Toast(page).isSaved();
  // Navigate to history page and verify "Linked" revision
  const history = await RevisionHistory.goTo(page, repository.id);
  await history.expectRevisionExists('Linked tiptap html element');
});

test('source element deletion detaches individually-linked copy', async ({
  page,
}) => {
  const { activity } = await toSeededRepository(page);
  await toEditorPage(page, activity);
  const editor = new Editor(page);
  // Link a primary-page element into the secondary page: an entry-point link
  // whose container activity is NOT itself a linked copy. Confirm the copy
  // renders there and is marked linked.
  await editor.toSecondaryPage();
  await editor.linkContentElements(seed.title, seed.textContent);
  await editor.getElement(seed.textContent).expectLinked();
  // Delete the source element on the primary page.
  await editor.toPrimaryPage();
  await editor.getElement(seed.textContent).remove();
  await expect(editor.getElement(seed.textContent).el).toHaveCount(0);
  await page.waitForLoadState('networkidle');
  // Deleting the source UNLINKS the copy rather than deleting it
  await page.reload({ waitUntil: 'networkidle' });
  await editor.toSecondaryPage();
  const copyElement = editor.getElement(seed.textContent);
  await expect(copyElement.el).toBeVisible();
  await copyElement.expectNotLinked();
});

test.afterAll(async () => {
  await SeedClient.resetDatabase();
});
