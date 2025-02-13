import { expect, test } from '@playwright/test';

import { AddRepositoryDialog } from '../../../pom/catalog/AddRepository.ts';
import { AppBar } from '../../../pom/common/AppBar.ts';
import { COLLAB_TEST_USER } from '../../../fixtures/auth.ts';
import SeedClient from '../../../api/SeedClient.ts';
import { UserManagement } from '../../../pom/admin/UserManagement.ts';

test.beforeAll(async () => {
  await SeedClient.resetDatabase();
  await SeedClient.seedUser({
    email: COLLAB_TEST_USER.email,
    userGroup: { name: 'Test', role: 'ADMIN' },
  });
});

test.describe('collaborator added to a User Group as Admin,', () => {
  test('i should be able to create Repository', async ({ page }) => {
    await page.goto('/');
    const dialog = new AddRepositoryDialog(page);
    await expect(dialog.openDialogBtn).toBeVisible();
    await dialog.open();
    await dialog.createRepository();
  });

  test('i should see the Admin menu entry', async ({ page }) => {
    await page.goto('/');
    const appBar = new AppBar(page);
    await expect(appBar.adminLink).toBeVisible();
  });

  test('i should be able to access group listing', async ({ page }) => {
    await page.goto('/');
    const appBar = new AppBar(page);
    await expect(appBar.adminLink).toBeVisible();
    await appBar.adminLink.click();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL('/admin/user-groups');
  });

  test('i should not be able to access User Management', async ({ page }) => {
    await page.goto(UserManagement.route);
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL('/');
  });
});
