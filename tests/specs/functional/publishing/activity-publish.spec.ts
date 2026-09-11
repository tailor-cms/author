import { expect, test } from '@playwright/test';

import { ActivityOutline } from '../../../pom/repository/Outline';
import { Catalog } from '../../../pom/catalog/Catalog';
import { Editor } from '../../../pom/editor/Editor';
import { EditorToolbar } from '../../../pom/editor/EditorToolbar';
import { OutlineSidebar } from '../../../pom/repository/OutlineSidebar';
import SeedClient from '../../../api/SeedClient';
import {
  outlineLevel,
  outlineSeed,
  toEmptyRepository,
  toSeededRepository,
} from '../../../helpers/seed';

test.beforeEach(async () => {
  await SeedClient.resetDatabase();
});

test.afterAll(async () => {
  await SeedClient.resetDatabase();
});

test('publishes an activity and its children from the outline sidebar', async ({
  page,
}) => {
  await toSeededRepository(page);
  await page.waitForLoadState('networkidle');

  const outline = new ActivityOutline(page);
  const item = await outline.getOutlineItemByName(outlineSeed.group.title);
  await item.select();

  const sidebar = new OutlineSidebar(page);
  await sidebar.expectNotPublished();

  await sidebar.publish();

  await sidebar.expectPublished();
  await sidebar.expectFullyPublished();
});

test('publishes a single page and shows it as published in the catalog', async ({
  page,
}) => {
  const repository = await toEmptyRepository(page, 'Single Page Course');

  const outline = new ActivityOutline(page);
  const item = await outline.addFirstItem(outlineLevel.LEAF, 'Standalone Page');
  await item.select();
  const sidebar = new OutlineSidebar(page);
  await sidebar.openEditor();
  await page.waitForLoadState('networkidle');

  const editor = new Editor(page);
  await editor.containerList.addContainer();
  await expect(page.locator('.content-container')).toHaveCount(1);
  await editor.addContentElement('Freshly authored content');
  await editor.toast.isSaved();
  await editor.toast.waitForDismiss();

  // Focus out of the element so the activity toolbar (with Publish) is shown
  await editor.deselectElement();

  const toolbar = new EditorToolbar(page);
  await toolbar.publishAndVerify();

  // With the only page published, the catalog reports the repo as published
  await page.goto('/');
  const card = new Catalog(page).findRepositoryCard(repository.name);
  await expect(card.getByLabel('Published')).toBeVisible();
  await expect(card.getByLabel('Has unpublished changes')).not.toBeVisible();
});
