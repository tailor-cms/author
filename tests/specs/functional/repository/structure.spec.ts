import { expect, test } from '@playwright/test';
import { faker } from '@faker-js/faker';

import { ActivityOutline } from '../../../pom/repository/Outline';
import ApiClient from '../../../api/ApiClient';
import { Editor } from '../../../pom/editor/Editor';
import { outlineSeed } from '../../../helpers/seed';
import { OutlineSidebar } from '../../../pom/repository/OutlineSidebar';
import SeedClient from '../../../api/SeedClient';

const REPOSITORY_API = new ApiClient('/api/repositories/');

const toEmptyRepository = async (page) => {
  const payload = {
    schema: 'COURSE_SCHEMA',
    name: `${faker.lorem.words(2)} ${new Date().getTime()}`,
    description: faker.lorem.words(4),
  };
  const { data: repository } = await REPOSITORY_API.create(payload as any);
  await page.goto(`/repository/${repository.id}/root/structure`);
  await page.waitForLoadState('networkidle');
  return repository;
};

const toSeededRepository = async (page) => {
  const { data } = await SeedClient.seedTestRepository();
  const { repository } = data;
  await page.goto(`/repository/${repository.id}/root/structure`);
};

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

test('should be able to create a Module using bottom add button', async ({
  page,
}) => {
  await toEmptyRepository(page);
  const outline = new ActivityOutline(page);
  await outline.addRootItem('Module', 'Module 1');
});

test('should be able to create a new sub-module', async ({ page }) => {
  await toEmptyRepository(page);
  const outline = new ActivityOutline(page);
  const parent = await outline.addRootItem('Module', 'Module 1');
  const subModuleName = 'Sub-Module 1';
  await parent.addInto('Module', subModuleName);
  await outline.getOutlineItemByName(subModuleName);
});

test('should be able to add a new module above', async ({ page }) => {
  await toEmptyRepository(page);
  const outline = new ActivityOutline(page);
  const anchor = await outline.addRootItem('Module', 'Module 1');
  const moduleName = 'Module above 1';
  await anchor.addAbove('Module', moduleName);
  await outline.getOutlineItemByName(moduleName);
});

test('should be able to add a new module below', async ({ page }) => {
  await toEmptyRepository(page);
  const outline = new ActivityOutline(page);
  const anchor = await outline.addRootItem('Module', 'Module 1');
  const moduleName = 'Module below 1';
  await anchor.addBelow('Module', moduleName);
  await outline.getOutlineItemByName(moduleName);
});

test('should be able to delete the activity', async ({ page }) => {
  await toSeededRepository(page);
  const targetItem = outlineSeed.group.title;
  await expect(page.getByText(targetItem)).toBeVisible();
  const outline = new ActivityOutline(page);
  const item = await outline.getOutlineItemByName(targetItem);
  await item.optionsMenu.remove();
  await expect(page.getByText(targetItem)).not.toBeVisible();
  // Test persistence
  await page.reload();
  await expect(page.getByText(targetItem)).not.toBeVisible();
});

test('should be able to edit the activity name', async ({ page }) => {
  await toSeededRepository(page);
  const targetItem = outlineSeed.group.title;
  await expect(page.getByText(targetItem)).toBeVisible();
  const outline = new ActivityOutline(page);
  const item = await outline.getOutlineItemByName(targetItem);
  await item.select();
  const sidebar = new OutlineSidebar(page);
  const newName = `${targetItem} - edited`;
  await sidebar.fillName(newName);
  await outline.getOutlineItemByName(newName);
  // Test persistence
  await page.reload();
  await expect(page.getByText(newName)).toBeVisible();
});

test('should be able to publish activity', async ({ page }) => {
  await toSeededRepository(page);
  const targetItem = outlineSeed.group.title;
  await expect(page.getByText(targetItem)).toBeVisible();
  const outline = new ActivityOutline(page);
  const item = await outline.getOutlineItemByName(targetItem);
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
  await outline.search('hi');
  const locator = page.locator('.structure-page .search-result');
  await expect(locator.nth(0)).toContainText(outlineSeed.primaryPage.title);
  await expect(locator.nth(1)).toContainText('Chicago Deep-Dish Pizza');
  await expect(locator).toHaveCount(2);
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
