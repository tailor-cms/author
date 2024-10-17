import { expect, test } from '@playwright/test';

import { outlineLevel, toEmptyRepository } from '../../../helpers/seed.ts';
import { ActivityOutline } from '../../../pom/repository/Outline.ts';
import { Editor } from '../../../pom/editor/Editor.ts';
import { expectAlert } from '../../../pom/common/utils.ts';
import { GeneralSettings } from '../../../pom/repository/RepositorySettings.ts';
import { OutlineSidebar } from '../../../pom/repository/OutlineSidebar.ts';
import SeedClient from '../../../api/SeedClient.ts';

const TAB_NAV_TEST_ID = 'repositoryRoot_nav';
const getHistoryRoute = (id) => `/repository/${id}/root/revisions`;

test.beforeEach(async () => {
  await SeedClient.resetDatabase();
});

test('should display a revision for created repository', async ({ page }) => {
  const repository = await toEmptyRepository(page);
  await page.goto(getHistoryRoute(repository.id));
  await expect(page.getByText('Created repository')).toBeVisible();
  await expect(page.locator('.revision')).toHaveCount(1);
});

test('should display a revision for updated repository', async ({ page }) => {
  await toEmptyRepository(page);
  const tabNavigation = page.getByTestId(TAB_NAV_TEST_ID);
  await tabNavigation.getByText('Settings').click();
  const settings = new GeneralSettings(page);
  await settings.updateName('Test update');
  await tabNavigation.getByText('History').click();
  await expect(page.getByText('Updated repository')).toBeVisible();
});

test('should display a revision for created group activity', async ({
  page,
}) => {
  const repository = await toEmptyRepository(page);
  const outline = new ActivityOutline(page);
  const groupName = 'Group 1';
  await outline.addRootItem(outlineLevel.GROUP, groupName);
  await page.goto(getHistoryRoute(repository.id));
  await expect(page.getByText(`Created ${groupName}`)).toBeVisible();
});

test('should display a revision for updated group activity', async ({
  page,
}) => {
  const repository = await toEmptyRepository(page);
  const outline = new ActivityOutline(page);
  const groupName = 'Group 1';
  await outline.addRootItem(outlineLevel.GROUP, groupName);
  const item = await outline.getOutlineItemByName(groupName);
  await item.select();
  const sidebar = new OutlineSidebar(page);
  await sidebar.fillName('Group 1 updated');
  await page.goto(getHistoryRoute(repository.id));
  await expect(page.getByText(`Updated ${groupName}`)).toBeVisible();
});

test('should display a revision for deleted group activity', async ({
  page,
}) => {
  const repository = await toEmptyRepository(page);
  const outline = new ActivityOutline(page);
  const groupName = 'Group 1';
  await outline.addRootItem(outlineLevel.GROUP, groupName);
  const item = await outline.getOutlineItemByName(groupName);
  await item.select();
  await item.optionsMenu.remove();
  await page.goto(getHistoryRoute(repository.id));
  await expect(page.getByText(`Removed ${groupName}`)).toBeVisible();
});

test('should display a revision for created content element', async ({
  page,
}) => {
  const repository = await toEmptyRepository(page);
  const outline = new ActivityOutline(page);
  const leafName = 'Leaf 1';
  await outline.addRootItem(outlineLevel.LEAF, leafName);
  const item = await outline.getOutlineItemByName(leafName);
  await item.select();
  await item.openBtn.click();
  await page.waitForLoadState('networkidle');
  const editor = new Editor(page);
  await editor.addContentElement();
  await page.goto(getHistoryRoute(repository.id));
  await expect(
    page.getByText(`Created ${editor.primaryElementLabel} element`),
  ).toBeVisible();
});

test('should display a revision for updated content element', async ({
  page,
}) => {
  const repository = await toEmptyRepository(page);
  const outline = new ActivityOutline(page);
  const leafName = 'Leaf 1';
  await outline.addRootItem(outlineLevel.LEAF, leafName);
  const item = await outline.getOutlineItemByName(leafName);
  await item.select();
  await item.openBtn.click();
  await page.waitForLoadState('networkidle');
  const editor = new Editor(page);
  await editor.addContentElement();
  const elements = await editor.getElements();
  await elements[0].el.locator('.tiptap').fill('updated content');
  await expectAlert(page, 'Element saved');
  await page.waitForLoadState('networkidle');
  await page.goto(getHistoryRoute(repository.id));
  await expect(
    page.getByText(`Changed ${editor.primaryElementLabel}`),
  ).toBeVisible();
});

test('should display a revision for deleted content element', async ({
  page,
}) => {
  const repository = await toEmptyRepository(page);
  const outline = new ActivityOutline(page);
  const leafName = 'Leaf 1';
  await outline.addRootItem(outlineLevel.LEAF, leafName);
  const item = await outline.getOutlineItemByName(leafName);
  await item.select();
  await item.openBtn.click();
  await page.waitForLoadState('networkidle');
  const editor = new Editor(page);
  await editor.addContentElement();
  await editor.removeContentElements();
  await page.goto(getHistoryRoute(repository.id));
  await expect(
    page.getByText(`Removed ${editor.primaryElementLabel} element`),
  ).toBeVisible();
});

test.afterAll(async () => {
  await SeedClient.resetDatabase();
});
