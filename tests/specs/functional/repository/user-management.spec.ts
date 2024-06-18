import { expect, test } from '@playwright/test';

import {
  toEmptyRepository,
  toSeededRepository,
} from '../../../helpers/seed.ts';
import { RepositoryUsers } from '../../../pom/repository/RepositorySettings.ts';
import SeedClient from '../../../api/SeedClient.ts';

const getRoute = (id) => `/repository/${id}/root/settings/user-management`;

test.beforeEach(async () => {
  await SeedClient.resetDatabase();
});

test('should enable user access to a repository', async ({ page }) => {
  const repository = await toEmptyRepository(page);
  await page.goto(getRoute(repository.id));
  const settings = new RepositoryUsers(page);
  await settings.addUser('test+1@gostudion.com');
});

test('should revoke user access to a repository', async ({ page }) => {
  const repository = await toEmptyRepository(page);
  await page.goto(getRoute(repository.id));
  const settings = new RepositoryUsers(page);
  await settings.addUser('test+1@gostudion.com');
  await settings.removeUser('test+1@gostudion.com');
});

test('should be able to update user role', async ({ page }) => {
  const repository = await toSeededRepository(page);
  await page.goto(getRoute(repository.id));
  const repositoryUsers = new RepositoryUsers(page);
  await expect(repositoryUsers.el).toContainText('admin@gostudion.com');
  const userEntry = repositoryUsers
    .getEntryByEmail('admin@gostudion.com')
    .locator('.user-entry-role');
  await userEntry.click();
  const dropdownMenu = page.locator('.v-overlay.v-menu');
  await dropdownMenu
    .locator('.v-list-item-title')
    .filter({ hasText: 'Author' })
    .click();
  await expect(page.getByText('User updated')).toBeVisible();
  await expect(userEntry).toHaveText('Author');
});

test.afterAll(async () => {
  await SeedClient.resetDatabase();
});
