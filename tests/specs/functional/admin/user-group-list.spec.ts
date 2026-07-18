import { expect, test } from '@playwright/test';
import { times } from 'lodash-es';

import {
  GroupManagement,
  UserGroupUserList,
} from '../../../pom/admin/GroupManagement.ts';
import {
  addUserGroupMembers,
  createCleanRepository,
  createUserGroup,
} from '../../../helpers/seed.ts';
import ApiClient from '../../../api/ApiClient.ts';
import SeedClient from '../../../api/SeedClient.ts';

const DEFAULT_GROUPS_PER_PAGE = 24;

const userGroupApi = new ApiClient('/api/user-group/');

test.beforeEach(async ({ page }) => {
  await SeedClient.resetDatabase();
  await page.goto(GroupManagement.route);
});

test('should be able to create user group', async ({ page }) => {
  const userGroupPage = new GroupManagement(page);
  const name = 'Test Group';
  await userGroupPage.addUserGroup(name);
  await page.reload();
  await expect(userGroupPage.groupGrid).toContainText(name);
});

test('should be able to edit user group', async ({ page }) => {
  const userGroupPage = new GroupManagement(page);
  const name = 'Test Group';
  await userGroupPage.addUserGroup(name);
  const entry = await userGroupPage.getEntryByName(name);
  const updatedName = 'Edited Test Group';
  await entry.edit(updatedName);
  await page.reload();
  await expect(userGroupPage.groupGrid).toContainText(updatedName);
});

test('should be able to remove user group', async ({ page }) => {
  const userGroupPage = new GroupManagement(page);
  const name = 'Test Group';
  await userGroupPage.addUserGroup(name);
  await expect(userGroupPage.groupGrid).toContainText(name);
  await page.reload();
  await userGroupPage.removeUserGroup(name);
  await expect(userGroupPage.el).not.toContainText(name);
  await page.reload();
  await expect(userGroupPage.el).not.toContainText(name);
});

test('should be able to paginate groups', async ({ page }) => {
  const userGroupPage = new GroupManagement(page);
  const pageOverflow = 1;
  const groupCreateCount = DEFAULT_GROUPS_PER_PAGE + pageOverflow;
  // Seed through the API; creating this many via the dialog is too slow
  for (const i of times(groupCreateCount)) {
    await userGroupApi.create({ name: `Test Group ${i}` } as any);
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
  await userGroupPage.searchInput.fill(target);
  await expect(userGroupPage.groupGrid).toContainText(target);
  await expect(userGroupPage.groupEntriesLocator).toHaveCount(1);
  await userGroupPage.searchInput.fill('sdlkas');
  await expect(userGroupPage.groupEntriesLocator).toHaveCount(0);
});

test('should show member and repository counts on a group card', async ({
  page,
}) => {
  const group = await createUserGroup('Counts Group');
  await addUserGroupMembers(group.id, [
    'count-a@gostudion.com',
    'count-b@gostudion.com',
  ]);
  await createCleanRepository('Counts Repo', [group.id]);
  const userGroupPage = new GroupManagement(page);
  await page.reload({ waitUntil: 'networkidle' });
  const entry = await userGroupPage.getEntryByName('Counts Group');
  await expect(entry.el).toContainText('2 members');
  await expect(entry.el).toContainText('1 repository');
});

test('should be able to search and sort group members', async ({ page }) => {
  const group = await createUserGroup('Roster Group');
  await addUserGroupMembers(group.id, [
    'roster-ann@gostudion.com',
    'roster-bob@gostudion.com',
    'roster-cara@gostudion.com',
  ]);
  const memberList = new UserGroupUserList(page);
  await page.goto(UserGroupUserList.getRoute(group.id));
  await expect(memberList.userEntriesLocator).toHaveCount(3);

  // Search narrows the roster by email
  await memberList.searchInput.fill('roster-bob');
  await expect(memberList.userEntriesLocator).toHaveCount(1);
  await expect(memberList.userEntriesLocator).toContainText('roster-bob');
  await memberList.searchInput.fill('');
  await expect(memberList.userEntriesLocator).toHaveCount(3);

  // Default order is A–Z; the toggle flips it to Z–A
  const entries = memberList.userEntriesLocator;
  await expect(entries.first()).toContainText('roster-ann');
  await expect(entries.last()).toContainText('roster-cara');
  await memberList.sortToggle.click();
  await expect(entries.first()).toContainText('roster-cara');
  await expect(entries.last()).toContainText('roster-ann');
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
