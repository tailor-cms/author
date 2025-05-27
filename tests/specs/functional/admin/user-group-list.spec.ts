import { expect, test } from '@playwright/test';
import { times } from 'lodash';

import {
  GroupManagement,
  UserGroupUserList,
} from '../../../pom/admin/GroupManagement.ts';
import SeedClient from '../../../api/SeedClient.ts';

const DEFAULT_GROUPS_PER_PAGE = 10;

test.beforeEach(async ({ page }) => {
  await SeedClient.resetDatabase();
  await page.goto(GroupManagement.route);
});

test('should be able to create user group', async ({ page }) => {
  const userGroupPage = new GroupManagement(page);
  const name = 'Test Group';
  await userGroupPage.addUserGroup(name);
  await page.reload();
  await expect(userGroupPage.groupTable).toContainText(name);
});

test('should be able to edit user group', async ({ page }) => {
  const userGroupPage = new GroupManagement(page);
  const name = 'Test Group';
  await userGroupPage.addUserGroup(name);
  const entry = await userGroupPage.getEntryByName(name);
  const updatedName = 'Edited Test Group';
  await entry.edit(updatedName);
  await page.reload();
  await expect(userGroupPage.groupTable).toContainText(updatedName);
});

test('should be able to remove user group', async ({ page }) => {
  const userGroupPage = new GroupManagement(page);
  const name = 'Test Group';
  await userGroupPage.addUserGroup(name);
  await expect(userGroupPage.groupTable).toContainText(name);
  await page.reload();
  await userGroupPage.removeUserGroup(name);
  await expect(userGroupPage.groupTable).not.toContainText(name);
  await page.reload();
  await expect(userGroupPage.groupTable).not.toContainText(name);
});

test('should be able to paginate groups', async ({ page }) => {
  const userGroupPage = new GroupManagement(page);
  const pageOverflow = 1;
  const groupCreateCount = DEFAULT_GROUPS_PER_PAGE + pageOverflow;
  for (const i of times(groupCreateCount)) {
    await userGroupPage.addUserGroup('Test Group ' + i);
  }
  await page.reload({ waitUntil: 'networkidle' });
  await expect(userGroupPage.groupEntriesLocator).toHaveCount(
    DEFAULT_GROUPS_PER_PAGE,
  );
  await userGroupPage.nextPage.click();
  await expect(userGroupPage.groupEntriesLocator).toHaveCount(pageOverflow);
  await userGroupPage.prevPage.click();
  await expect(userGroupPage.groupEntriesLocator).toHaveCount(
    DEFAULT_GROUPS_PER_PAGE,
  );
});

test('should be able to filter by name', async ({ page }) => {
  const userGroupPage = new GroupManagement(page);
  const groupCreateCount = 2;
  for (const i of times(groupCreateCount)) {
    await userGroupPage.addUserGroup(`Test Group ${i}`);
  }
  await page.reload();
  const target = 'Test Group 1';
  await userGroupPage.el.getByLabel('Search user groups').fill(target);
  await expect(userGroupPage.groupTable).toContainText(target);
  await expect(userGroupPage.groupEntriesLocator).toHaveCount(1);
  await userGroupPage.el.getByLabel('Search user groups').fill('sdlkas');
  await expect(userGroupPage.groupEntriesLocator).toHaveCount(0);
});

test('should be able to assign user to a group', async ({ page }) => {
  await GroupManagement.create(page, 'Test', { visit: true });
  const userGroupUserList = new UserGroupUserList(page);
  await userGroupUserList.addUser('test_user@gostudion.com', 'User');
});

test('should be able to remove user from a group', async ({ page }) => {
  await GroupManagement.create(page, 'Test', { visit: true });
  const userGroupUserList = new UserGroupUserList(page);
  const email = 'test_user@gostudion.com';
  await userGroupUserList.addUser(email, 'User');
  await userGroupUserList.removeUser(email);
});
