import { expect, test as setup } from '@playwright/test';
import userSeed from 'tailor-seed/user.json';

import { SignIn } from '../pom/auth';

const TEST_USER = userSeed[0];

setup('authenticate', async ({ page }) => {
  const authPage = new SignIn(page);
  await authPage.visit();
  await authPage.signIn(TEST_USER.email, TEST_USER.password);
  await page.waitForLoadState('networkidle');
  await expect(page).toHaveTitle(/Catalog/);
  await page.context().storageState({ path: '.auth.json' });
});
