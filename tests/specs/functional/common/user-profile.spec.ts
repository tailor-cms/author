import { expect, test } from '@playwright/test';

import SeedClient from '../../../api/SeedClient.ts';
import { UserProfile } from '../../../pom/common/UserProfile.ts';

test.beforeEach(async ({ page }) => {
  await SeedClient.resetDatabase();
  await page.goto('/user/profile');
});

test('should be able to access profile page', async ({ page }) => {
  await expect(page).toHaveTitle('User profile');
});

test('should be able to edit profile', async ({ page }) => {
  const profile = new UserProfile(page);
  await profile.editProfile('test+1@gostudion.com', 'John', 'Doe');
  await expect(page.getByText('User information updated!')).toBeVisible();
  await page.reload();
  await expect(profile.email).toHaveValue('test+1@gostudion.com');
  await expect(profile.firstName).toHaveValue('John');
  await expect(profile.lastName).toHaveValue('Doe');
});

test.afterAll(async () => {
  await SeedClient.resetDatabase();
});
