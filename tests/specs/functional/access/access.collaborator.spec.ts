import { expect, test } from '@playwright/test';

import { AdminSection } from '../../../pom/admin/Admin.ts';
import { AddRepositoryDialog } from '../../../pom/catalog/AddRepository.ts';
import { AppBar } from '../../../pom/common/AppBar.ts';
import { COLLAB_TEST_USER } from '../../../fixtures/auth.ts';
import {
  GroupManagement,
  UserGroupUserList,
} from '../../../pom/admin/GroupManagement.ts';
import {
  GeneralSettings,
  Sidebar as SettingsSidebar,
} from '../../../pom/repository/RepositorySettings.ts';
import SeedClient from '../../../api/SeedClient.ts';
import { toEmptyRepository } from '../../../helpers/seed.ts';

test.describe('Collaborator, without User Group assignment', () => {
  test.beforeEach(async () => {
    await SeedClient.resetDatabase();
  });

  test('should not be able to create Repository', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    const dialog = new AddRepositoryDialog(page);
    await expect(dialog.openDialogBtn).not.toBeVisible();
  });

  test('should not see the Admin menu entry', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    const appBar = new AppBar(page);
    await expect(appBar.catalogLink).toBeVisible();
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

test.describe('Collaborator added to a User Group as Admin,', () => {
  test.beforeEach(async () => {
    await SeedClient.resetDatabase();
    await SeedClient.seedUser({
      email: COLLAB_TEST_USER.email,
      userGroup: { name: 'Test', role: 'ADMIN' },
    });
  });

  test('should be able to create Repository', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    const dialog = new AddRepositoryDialog(page);
    await dialog.open();
    await dialog.createRepository();
  });

  test('should see the Admin menu entry', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    const appBar = new AppBar(page);
    await expect(appBar.adminLink).toBeVisible();
  });

  test('should be able to access group listing', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
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
    await userGroupUserList.addUser('test_user@gostudion.com', 'User');
  });

  test('should be able to remove user from a group', async ({ page }) => {
    await GroupManagement.goToGroupByName(page, 'Test');
    const userGroupUserList = new UserGroupUserList(page);
    await userGroupUserList.addUser('test_user@gostudion.com', 'User');
    await userGroupUserList.removeUser('test_user@gostudion.com');
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

  test('should be able to access user listing', async ({ page }) => {
    const repository = await toEmptyRepository(page, 'Test', [1]);
    const userAccessRoute = SettingsSidebar.getUserAccessRoute(repository.id);
    await page.goto(userAccessRoute, { waitUntil: 'networkidle' });
    const settings = new GeneralSettings(page);
    await expect(settings.sidebar.el).toBeVisible();
    await expect(page).toHaveURL(userAccessRoute);
  });

  test('should be able to access repository group listing', async ({
    page,
  }) => {
    const repository = await toEmptyRepository(page, 'Test', [1]);
    const groupRoute = SettingsSidebar.getGroupAccessRoute(repository.id);
    await page.goto(groupRoute, { waitUntil: 'networkidle' });
    const settings = new GeneralSettings(page);
    await expect(settings.sidebar.el).toBeVisible();
    await expect(page).toHaveURL(groupRoute);
  });
});

test.describe('Collaborator added to a User Group as Default User,', () => {
  test.beforeEach(async () => {
    await SeedClient.resetDatabase();
    await SeedClient.seedUser({
      email: COLLAB_TEST_USER.email,
      userGroup: { name: 'Test', role: 'USER' },
    });
  });

  test('should be able to create Repository', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    const dialog = new AddRepositoryDialog(page);
    await dialog.open();
    await dialog.createRepository();
  });

  test('should not see the Admin menu entry', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    const appBar = new AppBar(page);
    await expect(appBar.catalogLink).toBeVisible();
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

  test('should not be able to access user listing', async ({ page }) => {
    const repository = await toEmptyRepository(page, 'Test', [1]);
    const userAccessRoute = SettingsSidebar.getUserAccessRoute(repository.id);
    await page.goto(userAccessRoute, { waitUntil: 'networkidle' });
    await expect(page).toHaveURL('/');
  });

  test('should not be able to access repository group listing', async ({
    page,
  }) => {
    const repository = await toEmptyRepository(page, 'Test', [1]);
    const groupRoute = SettingsSidebar.getGroupAccessRoute(repository.id);
    await page.goto(groupRoute, { waitUntil: 'networkidle' });
    await expect(page).toHaveURL('/');
  });
});

test.describe('Collaborator added to a User Group with Colaborator role', () => {
  test.beforeEach(async () => {
    await SeedClient.resetDatabase();
    await SeedClient.seedUser({
      email: COLLAB_TEST_USER.email,
      userGroup: { name: 'Test', role: 'COLLABORATOR' },
    });
  });

  test('should not be able to create Repository', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    const dialog = new AddRepositoryDialog(page);
    await expect(dialog.openDialogBtn).not.toBeVisible();
  });

  test('should not see the Admin menu entry', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    const appBar = new AppBar(page);
    await expect(appBar.catalogLink).toBeVisible();
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

  test('should not be able to access user listing', async ({ page }) => {
    const repository = await toEmptyRepository(page, 'Test', [1]);
    const userAccessRoute = SettingsSidebar.getUserAccessRoute(repository.id);
    await page.goto(userAccessRoute, { waitUntil: 'networkidle' });
    await expect(page).toHaveURL('/');
  });

  test('should not be able to access repository group listing', async ({
    page,
  }) => {
    const repository = await toEmptyRepository(page, 'Test', [1]);
    const groupRoute = SettingsSidebar.getGroupAccessRoute(repository.id);
    await page.goto(groupRoute, { waitUntil: 'networkidle' });
    await expect(page).toHaveURL('/');
  });
});
