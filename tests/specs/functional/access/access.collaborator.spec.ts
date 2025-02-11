import { expect, test } from '@playwright/test';

import { AddRepositoryDialog } from '../../../pom/catalog/AddRepository.ts';
import { AppBar } from '../../../pom/common/AppBar.ts';
import { GroupManagement } from '../../../pom/admin/GroupManagement.ts';
import { UserManagement } from '../../../pom/admin/UserManagement.ts';
import SeedClient from '../../../api/SeedClient.ts';

test.beforeAll(async () => {
  await SeedClient.resetDatabase();
});

test('as a Collaborator, I should not be able to create Repository', async ({
  page,
}) => {
  await page.goto('/');
  const dialog = new AddRepositoryDialog(page);
  await expect(dialog.openDialogBtn).not.toBeVisible();
});

test('as a Collaborator, I should not see the Admin menu entry', async ({
  page,
}) => {
  await page.goto('/');
  const appBar = new AppBar(page);
  await expect(appBar.adminLink).not.toBeVisible();
});

test('as a Collaborator, I should not be able to access User Management', async ({
  page,
}) => {
  await page.goto(UserManagement.route);
  await page.waitForLoadState('networkidle');
  await expect(page).toHaveURL('/');
});

test('as a Collaborator, I should not be able to access Group management', async ({
  page,
}) => {
  await page.goto(GroupManagement.route);
  await page.waitForLoadState('networkidle');
  await expect(page).toHaveURL('/');
});

test('as a Collaborator, I should not be able to access Structure Types', async ({
  page,
}) => {
  await page.goto('/admin/structure-types');
  await page.waitForLoadState('networkidle');
  await expect(page).toHaveURL('/');
});

test('as a Collaborator, I should not be able to access Installed Elements', async ({
  page,
}) => {
  await page.goto('/admin/installed-elements');
  await page.waitForLoadState('networkidle');
  await expect(page).toHaveURL('/');
});
