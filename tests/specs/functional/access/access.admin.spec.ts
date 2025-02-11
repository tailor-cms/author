import { expect, test } from '@playwright/test';

import {
  UserManagement,
} from '../../../pom/admin/UserManagement.ts';
import {
  GroupManagement,
} from '../../../pom/admin/GroupManagement.ts';
import SeedClient from '../../../api/SeedClient.ts';

test.beforeAll(async () => {
  await SeedClient.resetDatabase();
});

test('As a Admin I should be able to see 4 menu entries', async ({ page }) => {
  await page.goto(UserManagement.route);
  const sidebarLocator = page.locator('.admin-sidebar');
  await expect(sidebarLocator.locator('.v-list-item')).toHaveCount(4);
  await expect(sidebarLocator).toContainText('System Users');
  await expect(sidebarLocator).toContainText('User Groups');
  await expect(sidebarLocator).toContainText('Structure Types');
  await expect(sidebarLocator).toContainText('Installed Elements');
});

test('I should be able to access user management as an admin', async ({ page }) => {
  await page.goto(UserManagement.route);
  await expect(page).toHaveURL(UserManagement.route);
  const userManagement = new UserManagement(page);
  await expect(userManagement.el).toBeVisible();
});

test('I should be able to access group management as an admin', async ({ page }) => {
  await page.goto(GroupManagement.route);
  await expect(page).toHaveURL(GroupManagement.route);
  const groupManagement = new GroupManagement(page);
  await expect(groupManagement.el).toBeVisible();
});

test('I should be able to access Structure Types', async ({ page }) => {
  await page.goto('/admin/structure-types');
  await page.waitForLoadState('networkidle');
  await expect(page).toHaveURL('/admin/structure-types');
});

test('I should be able to access Installed Elements', async ({ page }) => {
  await page.goto('/admin/installed-elements');
  await page.waitForLoadState('networkidle');
  await expect(page).toHaveURL('/admin/installed-elements');
});
