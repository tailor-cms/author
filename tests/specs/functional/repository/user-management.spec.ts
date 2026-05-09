import { expect, test } from '@playwright/test';
import { times } from 'lodash-es';

import {
  AddUserDialog,
  RepositoryUsers,
} from '../../../pom/repository/RepositorySettings.ts';
import {
  toEmptyRepository,
  toSeededRepository,
} from '../../../helpers/seed.ts';
import SeedClient from '../../../api/SeedClient.ts';

const ITEMS_PER_PAGE = 10;

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
  const entry = repositoryUsers.getEntryByEmail('admin@gostudion.com');
  const roleBtn = entry.locator('.user-role-btn');
  await repositoryUsers.setUserRole('admin@gostudion.com', 'Author');
  await expect(page.getByText('User updated')).toBeVisible();
  await expect(roleBtn).toHaveText('Author');
});

test('should be able to paginate', async ({ page }) => {
  const repository = await toEmptyRepository(page);
  // Seed enough users to overflow the first page
  const userCreateCount = ITEMS_PER_PAGE + 1;
  const createdUsers = await Promise.all(
    times(userCreateCount, () => SeedClient.seedUser()),
  ).then((res) => res.map((res) => res.data));
  await page.goto(RepositoryUsers.getRoute(repository.id), {
    waitUntil: 'networkidle',
  });
  const repositoryUsers = new RepositoryUsers(page);
  for (const user of createdUsers) {
    await repositoryUsers.addBtn.click();
    const dialog = new AddUserDialog(page);
    await dialog.addUser(user.email, 'Author');
    await expect(dialog.el).not.toBeVisible();
  }
  await page.reload();
  await page.waitForLoadState('networkidle');
  await expect(repositoryUsers.userEntriesLocator).toHaveCount(ITEMS_PER_PAGE);
  await expect(repositoryUsers.pagination).toBeVisible();
  await repositoryUsers.nextPage.click();
  const userTotal = userCreateCount + 1; // +1 for the repository creator
  const nextPageTotal = userTotal - ITEMS_PER_PAGE;
  await expect(repositoryUsers.userEntriesLocator).toHaveCount(nextPageTotal);
  await repositoryUsers.prevPage.click();
  await expect(repositoryUsers.userEntriesLocator).toHaveCount(ITEMS_PER_PAGE);
});

test.afterAll(async () => {
  await SeedClient.resetDatabase();
});
