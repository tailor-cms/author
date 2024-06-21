import { expect, test } from '@playwright/test';

import SeedClient from '../../../api/SeedClient.ts';
import { UserManagement } from '../../../pom/admin/UserManagement.ts';

test.beforeEach(async ({ page }) => {
  await SeedClient.resetDatabase();
  await page.goto('/admin/user-management');
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

test('should be able to revoke user access', async ({ page }) => {
  const email = 'test+1@gostudion.com';
  const userManagement = new UserManagement(page);
  await userManagement.addUser(email);
  const entry = await userManagement.getEntryByEmail(email);
  await entry.archive();
  await expect(userManagement.userTable).not.toContainText(email);
  await userManagement.archiveToggle.click();
  await expect(userManagement.userTable).toContainText(email);
});

test('should be able to restore user access', async ({ page }) => {
  const email = 'test+1@gostudion.com';
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
});

test.afterAll(async () => {
  await SeedClient.resetDatabase();
});
