import { expect, test as setup } from '@playwright/test';

import { SignIn } from '../pom/auth';
import { ADMIN_TEST_USER } from '../fixtures/auth';

setup('authenticate', async ({ page }) => {
  const authPage = new SignIn(page);
  await authPage.visit();
  await authPage.signIn(ADMIN_TEST_USER.email, ADMIN_TEST_USER.password);
  await page.waitForLoadState('networkidle');
  await expect(page).toHaveTitle(/Catalog/);
  await page.context().storageState({ path: '.auth-admin.json' });
});
