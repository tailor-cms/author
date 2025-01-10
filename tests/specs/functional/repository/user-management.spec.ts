import { expect, test } from '@playwright/test';
import times from 'lodash/times';
import userSeed from 'tailor-seed/user.json';

import {
  AddUserDialog,
  RepositoryUsers,
} from '../../../pom/repository/RepositorySettings.ts';
import {
  toEmptyRepository,
  toSeededRepository,
} from '../../../helpers/seed.ts';
import SeedClient from '../../../api/SeedClient.ts';

const DEFAULT_USERS_PER_PAGE = 10;

test.beforeEach(async () => {
  await SeedClient.resetDatabase();
});

test('should enable user access to a repository', async ({ page }) => {
  const repository = await toEmptyRepository(page);
  await page.goto(RepositoryUsers.getRoute(repository.id));
  const settings = new RepositoryUsers(page);
  await settings.addUser('test+1@gostudion.com');
});

test('should not be able to add user with invalid email', async ({ page }) => {
  const repository = await toEmptyRepository(page);
  await page.goto(RepositoryUsers.getRoute(repository.id));
  const settings = new RepositoryUsers(page);
  await settings.addBtn.click();
  const dialog = new AddUserDialog(page);
  await dialog.emailInput.fill('invalid-email');
  await dialog.setRole('Admin');
  await dialog.addBtn.click();
  await dialog.hasVisibleAlert(/must be a valid email/);
});

test('should not be able to add user without role', async ({ page }) => {
  const repository = await toEmptyRepository(page);
  await page.goto(RepositoryUsers.getRoute(repository.id));
  const settings = new RepositoryUsers(page);
  await settings.addBtn.click();
  const dialog = new AddUserDialog(page);
  await dialog.emailInput.fill('test+1@gostudion.com');
  await dialog.addBtn.click();
  await dialog.hasVisibleAlert(/Role is a required field/);
});

test('should revoke user access to a repository', async ({ page }) => {
  const repository = await toEmptyRepository(page);
  await page.goto(RepositoryUsers.getRoute(repository.id));
  const settings = new RepositoryUsers(page);
  await settings.addUser('test+1@gostudion.com');
  await settings.removeUser('test+1@gostudion.com');
});

test('should be able to update user role', async ({ page }) => {
  const { repository } = await toSeededRepository(page);
  await page.goto(RepositoryUsers.getRoute(repository.id));
  const repositoryUsers = new RepositoryUsers(page);
  await expect(repositoryUsers.el).toContainText('admin@gostudion.com');
  const roleSelect = repositoryUsers
    .getEntryByEmail('admin@gostudion.com')
    .locator('.user-entry-role');
  await roleSelect.click();
  // Select mounted outside
  const dropdownMenu = page.locator('.v-overlay.v-menu');
  await dropdownMenu
    .locator('.v-list-item-title')
    .filter({ hasText: 'Author' })
    .click();
  await expect(page.getByText('User updated')).toBeVisible();
  await expect(roleSelect).toHaveText('Author');
});

test('should be able to paginate', async ({ page }) => {
  const repository = await toEmptyRepository(page);
  await page.goto(RepositoryUsers.getRoute(repository.id));
  const userManagement = new RepositoryUsers(page);
  // Make sure all of the newly created users are displayed
  await userManagement.selectItemsPerPage(100);
  // Calculate the number of users to create to have two pages
  const userCreateCount = DEFAULT_USERS_PER_PAGE + 1;
  const createdUsers = await Promise.all(
    times(userCreateCount, () => SeedClient.seedUser()),
  ).then((responses) => responses.map((res) => res.data));
  for (const user of createdUsers) {
    // Assign the user to the repository
    await userManagement.addUser(user.email, 'Author');
  }
  await page.reload();
  await page.waitForLoadState('networkidle');
  // First page should have the maximum number of users per page
  await expect(userManagement.userEntriesLocator).toHaveCount(
    DEFAULT_USERS_PER_PAGE,
  );
  await userManagement.nextPage.click();
  const userTotal = userCreateCount + userSeed.length;
  const nextPageTotal =
    userTotal >= 2 * DEFAULT_USERS_PER_PAGE
      ? DEFAULT_USERS_PER_PAGE
      : userTotal - DEFAULT_USERS_PER_PAGE;
  await expect(userManagement.userEntriesLocator).toHaveCount(nextPageTotal);
  await userManagement.prevPage.click();
  await expect(userManagement.userEntriesLocator).toHaveCount(
    DEFAULT_USERS_PER_PAGE,
  );
});

test.afterAll(async () => {
  await SeedClient.resetDatabase();
});
