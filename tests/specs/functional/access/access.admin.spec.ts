import { expect, test } from '@playwright/test';

import { AdminSection } from '../../../pom/admin/Admin.ts';
import { AppBar } from '../../../pom/common/AppBar.ts';
import SeedClient from '../../../api/SeedClient.ts';

test.beforeAll(async () => {
  await SeedClient.resetDatabase();
});

// NOTE: Admin is a default test user so majority of the access tests
// are already covered as part of the remaining tests.
test.describe('as a System Admin', () => {
  test('should see the admin menu entry', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    const appBar = new AppBar(page);
    await expect(appBar.adminLink).toBeVisible();
  });

  test('should be able to see 4 menu entries', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    const appBar = new AppBar(page);
    await appBar.adminLink.click();
    const sidebarLocator = page.locator('.admin-sidebar');
    await expect(sidebarLocator.locator('.v-list-item')).toHaveCount(4);
    await expect(sidebarLocator).toContainText('System Users');
    await expect(sidebarLocator).toContainText('User Groups');
    await expect(sidebarLocator).toContainText('Structure Types');
    await expect(sidebarLocator).toContainText('Installed Elements');
  });

  test('should be able to access Structure Types', async ({ page }) => {
    await AdminSection.goToStructuresPage(page, { validate: true });
  });

  test('should be able to access Installed Elements', async ({ page }) => {
    await AdminSection.goToInstalledElementsList(page, { validate: true });
  });
});
