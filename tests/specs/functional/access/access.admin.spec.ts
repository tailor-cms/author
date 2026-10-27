import { expect, test } from '@playwright/test';

import { AdminRail } from '../../../pom/admin/AdminRail.ts';
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
    await appBar.openUserMenu();
    await expect(appBar.adminLink).toBeVisible();
  });

  test('should be able to see 5 rail entries', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    const appBar = new AppBar(page);
    await appBar.goToAdmin();
    const rail = new AdminRail(page);
    await expect(rail.tabs).toHaveText([
      'Users',
      'Groups',
      'Structures',
      'Elements',
      'Emoji',
    ]);
  });

  test('should be able to access Structure Types', async ({ page }) => {
    await AdminSection.goToStructuresPage(page, { validate: true });
  });

  test('should be able to access Installed Elements', async ({ page }) => {
    await AdminSection.goToInstalledElementsList(page, { validate: true });
  });
});
