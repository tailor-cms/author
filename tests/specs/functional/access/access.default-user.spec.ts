import { expect, test } from '@playwright/test';

import { AdminSection } from '../../../pom/admin/Admin.ts';
import { AddRepositoryDialog } from '../../../pom/catalog/AddRepository.ts';
import { AppBar } from '../../../pom/common/AppBar.ts';
import { DEFAULT_TEST_USER } from '../../../fixtures/auth.ts';
import {
  GroupManagement,
  UserGroupUserList,
} from '../../../pom/admin/GroupManagement.ts';
import SeedClient from '../../../api/SeedClient.ts';

test.describe('Default user role, without User Group assignment', () => {
  test.beforeEach(async () => {
    await SeedClient.resetDatabase();
  });

  test('should be able to create Repository', async ({ page }) => {
    await page.goto('/');
    const dialog = new AddRepositoryDialog(page);
    await dialog.open();
    await dialog.createRepository();
  });

  test('should not see the Admin menu entry', async ({ page }) => {
    await page.goto('/');
    const appBar = new AppBar(page);
    await expect(appBar.adminLink).not.toBeVisible();
  });

  test('should not be able to access User Management', async ({ page }) => {
    await AdminSection.goToUserManagement(page);
    await expect(page).toHaveURL('/');
  });

  test('should not be able to access Group management', async ({ page }) => {
    await AdminSection.goToGroupManagement(page);
    await expect(page).toHaveURL('/');
  });

  test('should not be able to access Structure Types', async ({ page }) => {
    await AdminSection.goToStructuresPage(page);
    await expect(page).toHaveURL('/');
  });

  test('should not be able to access Installed Elements', async ({ page }) => {
    await AdminSection.goToInstalledElementsList(page);
    await expect(page).toHaveURL('/');
  });
});

test.describe('Default user role, added to a User Group as Admin,', () => {
  test.beforeEach(async () => {
    await SeedClient.resetDatabase();
    await SeedClient.seedUser({
      email: DEFAULT_TEST_USER.email,
      userGroup: { name: 'Test', role: 'ADMIN' },
    });
  });

  test('should be able to create Repository', async ({ page }) => {
    await page.goto('/');
    const dialog = new AddRepositoryDialog(page);
    await dialog.open();
    await dialog.createRepository();
  });

  test('should see the Admin menu entry', async ({ page }) => {
    await page.goto('/');
    const appBar = new AppBar(page);
    await expect(appBar.adminLink).toBeVisible();
  });

  test('should be able to access group listing', async ({ page }) => {
    await page.goto('/');
    const appBar = new AppBar(page);
    await expect(appBar.adminLink).toBeVisible();
    await appBar.adminLink.click();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(AdminSection.groupManagementRoute);
  });

  test('should be able to access user group page', async ({ page }) => {
    await GroupManagement.goToGroupByName(page, 'Test');
  });

  test('should not be able to access group actions', async ({ page }) => {
    const groupManagement = await GroupManagement.visit(page);
    const groupEntry = await groupManagement.getEntryByName('Test');
    await expect(groupEntry.editBtn).not.toBeVisible();
    await expect(groupEntry.removeBtn).not.toBeVisible();
  });

  test('should be able to assign user to a group', async ({ page }) => {
    await GroupManagement.goToGroupByName(page, 'Test');
    const userGroupUserList = new UserGroupUserList(page);
    await userGroupUserList.addUser('user@gostudion.com', 'User');
  });

  test('should be able to remove user from a group', async ({ page }) => {
    await GroupManagement.goToGroupByName(page, 'Test');
    const userGroupUserList = new UserGroupUserList(page);
    await userGroupUserList.addUser('user@gostudion.com', 'User');
    await userGroupUserList.removeUser('user@gostudion.com');
  });

  test('should not be able to access User Management', async ({ page }) => {
    await AdminSection.goToUserManagement(page);
    await expect(page).toHaveURL('/');
  });

  test('should not be able to access Structure Types', async ({ page }) => {
    await AdminSection.goToStructuresPage(page);
    await expect(page).toHaveURL('/');
  });

  test('should not be able to access Installed Elements', async ({ page }) => {
    await AdminSection.goToInstalledElementsList(page);
    await expect(page).toHaveURL('/');
  });
});

test.describe('Default user role, added to a User Group as Default User,', () => {
  test.beforeEach(async () => {
    await SeedClient.resetDatabase();
    await SeedClient.seedUser({
      email: DEFAULT_TEST_USER.email,
      userGroup: { name: 'Test', role: 'USER' },
    });
  });

  test('should be able to create Repository', async ({ page }) => {
    await page.goto('/');
    const dialog = new AddRepositoryDialog(page);
    await dialog.open();
    await dialog.createRepository();
  });

  test('should not see the Admin menu entry', async ({ page }) => {
    await page.goto('/');
    const appBar = new AppBar(page);
    await expect(appBar.adminLink).not.toBeVisible();
  });

  test('should not be able to access Group management', async ({ page }) => {
    await AdminSection.goToGroupManagement(page);
    await expect(page).toHaveURL('/');
  });

  test('should not be able to access User Management', async ({ page }) => {
    await AdminSection.goToUserManagement(page);
    await expect(page).toHaveURL('/');
  });

  test('should not be able to access Structure Types', async ({ page }) => {
    await AdminSection.goToStructuresPage(page);
    await expect(page).toHaveURL('/');
  });

  test('should not be able to access Installed Elements', async ({ page }) => {
    await AdminSection.goToInstalledElementsList(page);
    await expect(page).toHaveURL('/');
  });
});

test.describe('Default user role, added to a Group with Colaborator role', () => {
  test.beforeEach(async () => {
    await SeedClient.resetDatabase();
    await SeedClient.seedUser({
      email: DEFAULT_TEST_USER.email,
      userGroup: { name: 'Test', role: 'COLLABORATOR' },
    });
  });

  test('should not be able to create Repository', async ({ page }) => {
    await page.goto('/');
    const dialog = new AddRepositoryDialog(page);
    await expect(dialog.openDialogBtn).not.toBeVisible();
  });

  test('should not see the Admin menu entry', async ({ page }) => {
    await page.goto('/');
    const appBar = new AppBar(page);
    await expect(appBar.adminLink).not.toBeVisible();
  });

  test('should not be able to access User Management', async ({ page }) => {
    await AdminSection.goToUserManagement(page);
    await expect(page).toHaveURL('/');
  });

  test('should not be able to access Group management', async ({ page }) => {
    await AdminSection.goToGroupManagement(page);
    await expect(page).toHaveURL('/');
  });

  test('should not be able to access Structure Types', async ({ page }) => {
    await AdminSection.goToStructuresPage(page);
    await expect(page).toHaveURL('/');
  });

  test('should not be able to access Installed Elements', async ({ page }) => {
    await AdminSection.goToInstalledElementsList(page);
    await expect(page).toHaveURL('/');
  });
});
