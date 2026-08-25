import { expect, test } from '@playwright/test';
import { times } from 'lodash-es';

import {
  AddUserDialog,
  getAccessRoute,
  RepositoryGroups,
  RepositoryMembers,
} from '../../../pom/repository/RepositoryAccess.ts';
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
  await page.goto(RepositoryMembers.getRoute(repository.id));
  const settings = new RepositoryMembers(page);
  await settings.addUser('test+1@gostudion.com');
});

test('should not be able to add user with invalid email', async ({ page }) => {
  const repository = await toEmptyRepository(page);
  await page.goto(RepositoryMembers.getRoute(repository.id));
  const settings = new RepositoryMembers(page);
  await settings.addBtn.click();
  const dialog = new AddUserDialog(page);
  await dialog.emailInput.fill('invalid-email');
  await dialog.setRole('Admin');
  await dialog.addBtn.click();
  await dialog.hasVisibleAlert(/must be a valid email/);
});

test('should not be able to add user without role', async ({ page }) => {
  const repository = await toEmptyRepository(page);
  await page.goto(RepositoryMembers.getRoute(repository.id));
  const settings = new RepositoryMembers(page);
  await settings.addBtn.click();
  const dialog = new AddUserDialog(page);
  await dialog.emailInput.fill('test+1@gostudion.com');
  await dialog.addBtn.click();
  await dialog.hasVisibleAlert(/Role is a required field/);
});

test('should revoke user access to a repository', async ({ page }) => {
  const repository = await toEmptyRepository(page);
  await page.goto(RepositoryMembers.getRoute(repository.id));
  const settings = new RepositoryMembers(page);
  await settings.addUser('test+1@gostudion.com');
  await settings.removeUser('test+1@gostudion.com');
});

test('should be able to update user role', async ({ page }) => {
  const { repository } = await toSeededRepository(page);
  await page.goto(RepositoryMembers.getRoute(repository.id));
  const repositoryUsers = new RepositoryMembers(page);
  await expect(repositoryUsers.el).toContainText('admin@gostudion.com');
  const roleBtn = repositoryUsers.getRoleButton('admin@gostudion.com');
  await repositoryUsers.setUserRole('admin@gostudion.com', 'Author');
  await expect(page.getByText('User updated')).toBeVisible();
  await expect(roleBtn).toHaveText('Author');
});

test('should be able to paginate', async ({ page }) => {
  const repository = await toEmptyRepository(page);
  // Seed enough users to overflow the first page
  const userCreateCount = DEFAULT_USERS_PER_PAGE + 1;
  const createdUsers = await Promise.all(
    times(userCreateCount, () => SeedClient.seedUser()),
  ).then((res) => res.map((res) => res.data));
  await page.goto(RepositoryMembers.getRoute(repository.id), {
    waitUntil: 'networkidle',
  });
  const repositoryUsers = new RepositoryMembers(page);
  for (const user of createdUsers) {
    await repositoryUsers.addBtn.click();
    const dialog = new AddUserDialog(page);
    await dialog.addUser(user.email, 'Author');
    await expect(dialog.el).not.toBeVisible();
  }
  await page.reload();
  await page.waitForLoadState('networkidle');
  await expect(repositoryUsers.userEntriesLocator).toHaveCount(DEFAULT_USERS_PER_PAGE);
  await expect(repositoryUsers.pagination).toBeVisible();
  await repositoryUsers.nextPage.click();
  const userTotal = userCreateCount + 1; // +1 for the repository creator
  const nextPageTotal = userTotal - DEFAULT_USERS_PER_PAGE;
  await expect(repositoryUsers.userEntriesLocator).toHaveCount(nextPageTotal);
  await repositoryUsers.prevPage.click();
  await expect(repositoryUsers.userEntriesLocator).toHaveCount(DEFAULT_USERS_PER_PAGE);
});

test('should switch between the Members and Groups tabs', async ({ page }) => {
  const repository = await toEmptyRepository(page);
  // The bare access route redirects to the Members section.
  await page.goto(getAccessRoute(repository.id));
  await expect(page).toHaveURL(/\/root\/access\/members$/);
  const members = new RepositoryMembers(page);
  // Members is the landing tab; the creator is its only entry.
  await expect(members.userEntriesLocator).toHaveCount(1);
  const groups = new RepositoryGroups(page);
  await groups.open();
  await expect(page).toHaveURL(/\/root\/access\/groups$/);
  await expect(members.userList).not.toBeVisible();
  await expect(groups.emptyState).toBeVisible();
  await members.open();
  await expect(page).toHaveURL(/\/root\/access\/members$/);
  await expect(members.userEntriesLocator).toHaveCount(1);
});

test.afterAll(async () => {
  await SeedClient.resetDatabase();
});
