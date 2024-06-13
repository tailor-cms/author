import { expect, test } from '@playwright/test';
import { faker } from '@faker-js/faker';

import { ActivityOutline } from '../../../pom/repository/Outline';
import ApiClient from '../../../api/ApiClient';
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
  await page.waitForLoadState('networkidle');
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

test('should be able to toggle expand / collapse', async ({ page }) => {
  await toSeededRepository(page);
  expect(page.getByText('Introduction to Pizza Making')).toBeVisible();
  expect(page.getByText('History of Pizza')).not.toBeVisible();
  const outline = new ActivityOutline(page);
  const module = await outline.getOutlineItemByName(
    'Introduction to Pizza Making',
  );
  await module.toggleExpand();
  expect(page.getByText('History of Pizza')).toBeVisible();
  await module.toggleExpand();
  expect(page.getByText('History of Pizza')).not.toBeVisible();
});

test('should be able to toggle expand / collapse using the alt control', async ({
  page,
}) => {
  await toSeededRepository(page);
  expect(page.getByText('Introduction to Pizza Making')).toBeVisible();
  expect(page.getByText('History of Pizza')).not.toBeVisible();
  const outline = new ActivityOutline(page);
  const module = await outline.getOutlineItemByName(
    'Introduction to Pizza Making',
  );
  await module.toggleExpandAlt();
  expect(page.getByText('History of Pizza')).toBeVisible();
  await module.toggleExpandAlt();
  expect(page.getByText('History of Pizza')).not.toBeVisible();
});

test('should be able to toggle expand/collapse using toggle all btn', async ({
  page,
}) => {
  await toSeededRepository(page);
  const outline = new ActivityOutline(page);
  await outline.toggleExpand();
  expect(page.getByText('History of Pizza')).toBeVisible();
  expect(page.getByText('Basics of Dough Making')).toBeVisible();
  await outline.toggleExpand();
  expect(page.getByText('History of Pizza')).not.toBeVisible();
  expect(page.getByText('Basics of Dough Making')).not.toBeVisible();
});

test.afterAll(async () => {
  await SeedClient.resetDatabase();
});
