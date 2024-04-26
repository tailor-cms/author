import { expect, test } from '@playwright/test';
import { faker } from '@faker-js/faker';

import { EndpointClient, getEndpointClient } from '../../../api/client';
import { ActivityOutline } from '../../../pom/repository/Outline';

let REPOSITORY_API: EndpointClient;
let REPOSITORY: any = null;

const createRepository = () => {
  const payload = {
    schema: 'COURSE_SCHEMA',
    name: `${faker.lorem.words(2)} ${new Date().getTime()}`,
    description: faker.lorem.words(4),
  };
  return REPOSITORY_API.create(payload as any);
};

test.beforeAll(async ({ baseURL }) => {
  if (!baseURL) throw new Error('baseURL is required');
  REPOSITORY_API = await getEndpointClient(baseURL, '/api/repositories/');
});

test.beforeEach(async ({ page }) => {
  const { data: repository } = await createRepository();
  await page.goto(`/repository/${repository.id}/root/structure`);
  await page.waitForLoadState('networkidle');
  REPOSITORY = repository;
});

test('repository root page has a title set', async ({ page }) => {
  await expect(page).toHaveTitle(REPOSITORY.name);
});

test('should have default intro message visible', async ({ page }) => {
  const intro = 'Click on the button below in order to create your first item!';
  const sidebarIntro =
    'Please create your first Item on the left to view and edit its details here.';
  await expect(page.getByText(intro)).toBeVisible();
  await expect(page.getByText(sidebarIntro)).toBeVisible();
});

test('should be able to create a Module using bottom add button', async ({
  page,
}) => {
  const outline = new ActivityOutline(page);
  await outline.addRootItem('Module', 'Module 1');
});

test('should be able to create a new sub-module', async ({ page }) => {
  const outline = new ActivityOutline(page);
  const parent = await outline.addRootItem('Module', 'Module 1');
  const subModuleName = 'Sub-Module 1';
  await parent.addInto('Module', subModuleName);
  await outline.getOutlineItemByName(subModuleName);
});

test('should be able to add a new module above', async ({ page }) => {
  const outline = new ActivityOutline(page);
  const anchor = await outline.addRootItem('Module', 'Module 1');
  const moduleName = 'Module above 1';
  await anchor.addAbove('Module', moduleName);
  await outline.getOutlineItemByName(moduleName);
});

test('should be able to add a new module below', async ({ page }) => {
  const outline = new ActivityOutline(page);
  const anchor = await outline.addRootItem('Module', 'Module 1');
  const moduleName = 'Module below 1';
  await anchor.addBelow('Module', moduleName);
  await outline.getOutlineItemByName(moduleName);
});

test.afterAll(async () => {
  // TODO: Cleanup
});
