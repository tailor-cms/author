import { expect, test } from '@playwright/test';
import times from 'lodash/times';
import userSeed from 'tailor-seed/user.json';

import {
  UserDialog,
  UserManagement,
} from '../../../pom/admin/UserManagement.ts';
import SeedClient from '../../../api/SeedClient.ts';

const DEFAULT_USERS_PER_PAGE = 10;

test.beforeEach(async ({ page }) => {
  await SeedClient.resetDatabase();
  await page.goto(UserManagement.route);
});

test('should be able to add new user to the platform', async ({ page }) => {
  const userManagement = new UserManagement(page);
  const email = 'tools+1@gostudion.com';
  await userManagement.addUser(email);
  await expect(userManagement.userTable).toContainText(email);
  await page.reload();
  await expect(userManagement.userTable).toContainText(email);
});

test('should be able to update a user', async ({ page }) => {
  const userManagement = new UserManagement(page);
  const email = 'tools+2@gostudion.com';
  await userManagement.addUser(email);
  const entry = await userManagement.getEntryByEmail(email);
  await entry.edit(email, {
    firstName: 'John',
    lastName: 'Doe',
    role: 'User',
  });
  await page.reload();
  await expect(userManagement.userTable).toContainText('John');
});

test('should not be able to add user with invalid Email', async ({ page }) => {
  const userManagement = new UserManagement(page);
  await userManagement.addBtn.click();
  const dialog = new UserDialog(page);
  await dialog.enterEmail('invalid-email');
  await dialog.enterFirstName('John');
  await dialog.enterLastName('Doe');
  await dialog.selectRole('Admin');
  await dialog.saveBtn.click();
  await dialog.hasVisibleAlert(/must be a valid email/);
});

test('should not be able to add user without Email', async ({ page }) => {
  const userManagement = new UserManagement(page);
  await userManagement.addBtn.click();
  const dialog = new UserDialog(page);
  await dialog.enterFirstName('Joe');
  await dialog.enterLastName('Doe');
  await dialog.selectRole('Admin');
  await dialog.saveBtn.click();
  await dialog.hasVisibleAlert(/Email is a required field/);
});

test('should not be able to add user with missing First name', async ({
  page,
}) => {
  const userManagement = new UserManagement(page);
  await userManagement.addBtn.click();
  const dialog = new UserDialog(page);
  await dialog.enterEmail('test@gostudion.com');
  await dialog.enterLastName('Doe');
  await dialog.selectRole('Admin');
  await dialog.saveBtn.click();
  await dialog.hasVisibleAlert(/First name is a required field/);
});

test('should not be able to add user with invalid First name', async ({
  page,
}) => {
  const userManagement = new UserManagement(page);
  await userManagement.addBtn.click();
  const dialog = new UserDialog(page);
  await dialog.enterEmail('test@gostudion.com');
  await dialog.enterFirstName('J');
  await dialog.enterLastName('Doe');
  await dialog.selectRole('Admin');
  await dialog.saveBtn.click();
  await dialog.hasVisibleAlert(/First name must be at least 2 char/);
});

test('should not be able to add user with missing Last name', async ({
  page,
}) => {
  const userManagement = new UserManagement(page);
  await userManagement.addBtn.click();
  const dialog = new UserDialog(page);
  await dialog.enterEmail('test@gostudion.com');
  await dialog.enterFirstName('John');
  await dialog.selectRole('Admin');
  await dialog.saveBtn.click();
  await dialog.hasVisibleAlert(/Last name is a required field/);
});

test('should not be able to add user with invalid Last name', async ({
  page,
}) => {
  const userManagement = new UserManagement(page);
  await userManagement.addBtn.click();
  const dialog = new UserDialog(page);
  await dialog.enterEmail('test@gostudion.com');
  await dialog.enterFirstName('John');
  await dialog.enterLastName('D');
  await dialog.selectRole('Admin');
  await dialog.saveBtn.click();
  await dialog.hasVisibleAlert(/Last name must be at least 2 char/);
});

test('should not be able to add user without a Role', async ({ page }) => {
  const userManagement = new UserManagement(page);
  await userManagement.addBtn.click();
  const dialog = new UserDialog(page);
  await dialog.enterEmail('test@gostudion.com');
  await dialog.enterFirstName('John');
  await dialog.enterLastName('Doe');
  await dialog.saveBtn.click();
  await dialog.hasVisibleAlert(/Role is a required field/);
});

test('should be able to revoke user access', async ({ page }) => {
  const email = 'test+3@gostudion.com';
  const userManagement = new UserManagement(page);
  await userManagement.addUser(email);
  const entry = await userManagement.getEntryByEmail(email);
  await entry.archive();
  await expect(userManagement.userTable).not.toContainText(email);
  await userManagement.archiveToggle.click();
  await expect(userManagement.userTable).toContainText(email);
});

test('should be able to restore user access', async ({ page }) => {
  const email = 'test+4@gostudion.com';
  const userManagement = new UserManagement(page);
  await userManagement.addUser(email);
  const entry = await userManagement.getEntryByEmail(email);
  await entry.archive();
  await expect(userManagement.userTable).not.toContainText(email);
  await userManagement.archiveToggle.click();
  await entry.restore();
  await page.reload();
  await expect(userManagement.userTable).toContainText(email);
});

test('should be able to search by email', async ({ page }) => {
  const email = 'admin@gostudion.com';
  const userManagement = new UserManagement(page);
  await userManagement.el.getByLabel('Search users').fill(email);
  await expect(userManagement.userTable).toContainText(email);
  const matches = await userManagement.getEntries();
  expect(matches).toHaveLength(1);
  await userManagement.el.getByLabel('Search users').fill('sdlkas');
  await expect(userManagement.userTable).not.toContainText(email);
});

test('should be able to paginate', async ({ page }) => {
  const nextPageTotal = userSeed.length % 10;
  await Promise.all(times(DEFAULT_USERS_PER_PAGE, () => SeedClient.seedUser()));
  await page.reload({ waitUntil: 'networkidle' });
  const userManagement = new UserManagement(page);
  await expect(userManagement.userEntriesLocator).toHaveCount(
    DEFAULT_USERS_PER_PAGE,
  );
  await userManagement.nextPage.click();
  await expect(userManagement.userEntriesLocator).toHaveCount(nextPageTotal);
  await userManagement.prevPage.click();
  await expect(userManagement.userEntriesLocator).toHaveCount(
    DEFAULT_USERS_PER_PAGE,
  );
});

test('should be able to alter number of entries shown per page', async ({
  page,
}) => {
  const userTotal = DEFAULT_USERS_PER_PAGE + userSeed.length;
  await Promise.all(times(DEFAULT_USERS_PER_PAGE, () => SeedClient.seedUser()));
  await page.reload();
  await page.waitForLoadState('networkidle');
  const userManagement = new UserManagement(page);
  await expect(userManagement.userEntriesLocator).toHaveCount(
    DEFAULT_USERS_PER_PAGE,
  );
  await userManagement.selectItemsPerPage(100);
  const entriesToShow = userTotal >= 100 ? 100 : userTotal;
  await expect(userManagement.userEntriesLocator).toHaveCount(entriesToShow);
});

test.afterAll(async () => {
  await SeedClient.resetDatabase();
});
