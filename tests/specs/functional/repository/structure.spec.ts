import { expect, test } from '@playwright/test';

import {
  outlineLevel,
  outlineSeed,
  toEmptyRepository,
  toSeededRepository,
} from '../../../helpers/seed';
import { ActivityOutline } from '../../../pom/repository/Outline';
import { Editor } from '../../../pom/editor/Editor';
import { OutlineSidebar } from '../../../pom/repository/OutlineSidebar';
import SeedClient from '../../../api/SeedClient';

test.beforeEach(async () => {
  await SeedClient.resetDatabase();
});

test('repository root page has a title set', async ({ page }) => {
  const repository = await toEmptyRepository(page);
  await expect(page).toHaveTitle(repository.name);
});

test('should have default intro message visible', async ({ page }) => {
  await toEmptyRepository(page);
  const intro = 'Click on the button below in order to create your first item!';
  const sidebarIntro =
    'Please create your first Item on the left to view and edit its details here.';
  await expect(page.getByText(intro)).toBeVisible();
  await expect(page.getByText(sidebarIntro)).toBeVisible();
});

test(`should create a ${outlineLevel.GROUP} using bottom add button`, async ({
  page,
}) => {
  await toEmptyRepository(page);
  const outline = new ActivityOutline(page);
  await outline.addRootItem(outlineLevel.GROUP, `${outlineLevel.GROUP} 1`);
});

test(`should be able to create a new sub ${outlineLevel.GROUP}`, async ({
  page,
}) => {
  await toEmptyRepository(page);
  const outline = new ActivityOutline(page);
  const parentName = `${outlineLevel.GROUP} 1`;
  const parent = await outline.addRootItem(outlineLevel.GROUP, parentName);
  const subLevelName = `Sub ${outlineLevel.GROUP}`;
  await parent.addInto(outlineLevel.GROUP, subLevelName);
  await outline.getOutlineItemByName(subLevelName);
});

test(`should be able to add a new ${outlineLevel.GROUP} above`, async ({
  page,
}) => {
  await toEmptyRepository(page);
  const outline = new ActivityOutline(page);
  const anchorName = `${outlineLevel.GROUP} 1`;
  const anchor = await outline.addRootItem(outlineLevel.GROUP, anchorName);
  const itemName = `${outlineLevel.GROUP} above`;
  await anchor.addAbove(outlineLevel.GROUP, itemName);
  await outline.getOutlineItemByName(itemName);
});

test(`should be able to add a new ${outlineLevel.GROUP} below`, async ({
  page,
}) => {
  await toEmptyRepository(page);
  const outline = new ActivityOutline(page);
  const anchorName = `${outlineLevel.GROUP} 1`;
  const anchor = await outline.addRootItem(outlineLevel.GROUP, anchorName);
  const itemName = `${outlineLevel.GROUP} below`;
  await anchor.addBelow(outlineLevel.GROUP, itemName);
  await outline.getOutlineItemByName(itemName);
});

test('should be able to delete the activity', async ({ page }) => {
  await toSeededRepository(page);
  const targetItem = outlineSeed.group.title;
  await expect(page.getByText(targetItem)).toBeVisible();
  const outline = new ActivityOutline(page);
  const item = await outline.getOutlineItemByName(targetItem);
  await item.optionsMenu.remove();
  const itemLocator = page.getByText(targetItem);
  await expect(itemLocator).not.toBeVisible();
  // Test persistence
  await page.reload();
  await expect(itemLocator).not.toBeVisible();
});

test('should be able to edit the activity name', async ({ page }) => {
  await toSeededRepository(page);
  const targetItemName = outlineSeed.group.title;
  await expect(page.getByText(targetItemName)).toBeVisible();
  const outline = new ActivityOutline(page);
  const item = await outline.getOutlineItemByName(targetItemName);
  await item.select();
  const sidebar = new OutlineSidebar(page);
  const newName = `${targetItemName} - edited`;
  await sidebar.fillName(newName);
  await outline.getOutlineItemByName(newName);
  // Test persistence
  await page.reload();
  await expect(page.getByText(newName)).toBeVisible();
});

test('should be able to publish activity', async ({ page }) => {
  await toSeededRepository(page);
  const targetItemName = outlineSeed.group.title;
  await expect(page.getByText(targetItemName)).toBeVisible();
  const outline = new ActivityOutline(page);
  const item = await outline.getOutlineItemByName(targetItemName);
  await item.select();
  const sidebar = new OutlineSidebar(page);
  await expect(sidebar.el).toContainText(/Not published/);
  await sidebar.publish();
  await expect(sidebar.el).toContainText(/Published on/);
});

test('should be able to toggle expand / collapse', async ({ page }) => {
  await toSeededRepository(page);
  await expect(page.getByText(outlineSeed.group.title)).toBeVisible();
  await expect(page.getByText(outlineSeed.primaryPage.title)).not.toBeVisible();
  const outline = new ActivityOutline(page);
  const module = await outline.getOutlineItemByName(outlineSeed.group.title);
  await module.toggleExpand();
  await expect(page.getByText(outlineSeed.primaryPage.title)).toBeVisible();
  await module.toggleExpand();
  await expect(page.getByText(outlineSeed.primaryPage.title)).not.toBeVisible();
});

test('should be able to toggle expand / collapse using the alt control', async ({
  page,
}) => {
  await toSeededRepository(page);
  await expect(page.getByText(outlineSeed.group.title)).toBeVisible();
  await expect(page.getByText(outlineSeed.primaryPage.title)).not.toBeVisible();
  const outline = new ActivityOutline(page);
  const module = await outline.getOutlineItemByName(outlineSeed.group.title);
  await module.toggleExpandAlt();
  await expect(page.getByText(outlineSeed.primaryPage.title)).toBeVisible();
  await module.toggleExpandAlt();
  await expect(page.getByText(outlineSeed.primaryPage.title)).not.toBeVisible();
});

test('should be able to toggle expand/collapse using toggle all btn', async ({
  page,
}) => {
  await toSeededRepository(page);
  const outline = new ActivityOutline(page);
  await expect(page.getByText(outlineSeed.primaryPage.title)).not.toBeVisible();
  await outline.toggleExpand();
  await expect(page.getByText(outlineSeed.primaryPage.title)).toBeVisible();
  await outline.toggleExpand();
  await expect(page.getByText(outlineSeed.primaryPage.title)).not.toBeVisible();
});

test('should be able to search by activity name', async ({ page }) => {
  await toSeededRepository(page);
  const outline = new ActivityOutline(page);
  await outline.search(outlineSeed.primaryPage.title);
  const locator = page.locator('.structure-page .search-result');
  await expect(locator.nth(0)).toContainText(outlineSeed.primaryPage.title);
  await expect(locator).toHaveCount(1);
});

test('should be able to navigate to editor page', async ({ page }) => {
  await toSeededRepository(page);
  const outline = new ActivityOutline(page);
  await outline.toggleExpand();
  const item = await outline.getOutlineItemByName(
    outlineSeed.primaryPage.title,
  );
  await item.select();
  const sidebar = new OutlineSidebar(page);
  await sidebar.openEditor();
  const editor = new Editor(page);
  await expect(editor.topToolbar).toContainText(outlineSeed.primaryPage.title);
});

test('should be able to post a comment', async ({ page }) => {
  await toSeededRepository(page);
  const targetItem = outlineSeed.group.title;
  await expect(page.getByText(targetItem)).toBeVisible();
  const outline = new ActivityOutline(page);
  const item = await outline.getOutlineItemByName(targetItem);
  await item.select();
  const sidebar = new OutlineSidebar(page);
  const comment = 'This is a test comment';
  await sidebar.comments.post(comment);
  await expect(sidebar.comments.thread).toContainText(comment);
});

test.afterAll(async () => {
  await SeedClient.resetDatabase();
});
