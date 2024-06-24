import { expect, test } from '@playwright/test';
import times from 'lodash/times';
import userSeed from 'tailor-seed/user.json';

import SeedClient from '../../../api/SeedClient.ts';
import { UserManagement } from '../../../pom/admin/UserManagement.ts';

const DEFAULT_USERS_PER_PAGE = 10;

test.beforeEach(async ({ page }) => {
  await SeedClient.resetDatabase();
  await page.goto(UserManagement.route);
});

test('should be able to add new user to the platform', async ({ page }) => {
  const userManagement = new UserManagement(page);
  const email = 'tools+1@gostudion.com';
  await userManagement.addUser(email);
  await expect(userManagement.userTable).toContainText(email);
  await page.reload();
  await expect(userManagement.userTable).toContainText(email);
});

test('should be able to update a user', async ({ page }) => {
  const userManagement = new UserManagement(page);
  const email = 'tools+2@gostudion.com';
  await userManagement.addUser(email);
  const entry = await userManagement.getEntryByEmail(email);
  await entry.edit(email, {
    firstName: 'John',
    lastName: 'Doe',
    role: 'User',
  });
  await page.reload();
  await expect(userManagement.userTable).toContainText('John');
});

test('should be able to revoke user access', async ({ page }) => {
  const email = 'test+3@gostudion.com';
  const userManagement = new UserManagement(page);
  await userManagement.addUser(email);
  const entry = await userManagement.getEntryByEmail(email);
  await entry.archive();
  await expect(userManagement.userTable).not.toContainText(email);
  await userManagement.archiveToggle.click();
  await expect(userManagement.userTable).toContainText(email);
});

test('should be able to restore user access', async ({ page }) => {
  const email = 'test+4@gostudion.com';
  const userManagement = new UserManagement(page);
  await userManagement.addUser(email);
  const entry = await userManagement.getEntryByEmail(email);
  await entry.archive();
  await expect(userManagement.userTable).not.toContainText(email);
  await userManagement.archiveToggle.click();
  await entry.restore();
  await page.reload();
  await expect(userManagement.userTable).toContainText(email);
});

test('should be able to search by email', async ({ page }) => {
  const email = 'admin@gostudion.com';
  const userManagement = new UserManagement(page);
  await userManagement.el.getByLabel('Search users').fill(email);
  await expect(userManagement.userTable).toContainText(email);
  const matches = await userManagement.getEntries();
  expect(matches).toHaveLength(1);
  await userManagement.el.getByLabel('Search users').fill('sdlkas');
  await expect(userManagement.userTable).not.toContainText(email);
});

test('should be able to paginate', async ({ page }) => {
  const userCreateCount = DEFAULT_USERS_PER_PAGE + 1;
  await Promise.all(times(userCreateCount, () => SeedClient.seedUser()));
  await page.reload();
  await page.waitForLoadState('networkidle');
  const userManagement = new UserManagement(page);
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

test('should be able to alter number of entries shown per page', async ({
  page,
}) => {
  const userCreateCount = DEFAULT_USERS_PER_PAGE + 1;
  await Promise.all(times(userCreateCount, () => SeedClient.seedUser()));
  await page.reload();
  await page.waitForLoadState('networkidle');
  const userManagement = new UserManagement(page);
  await expect(userManagement.userEntriesLocator).toHaveCount(
    DEFAULT_USERS_PER_PAGE,
  );
  await userManagement.selectItemsPerPage(100);
  const userTotal = userCreateCount + userSeed.length;
  const entriesToShow = userTotal >= 100 ? 100 : userTotal;
  await expect(userManagement.userEntriesLocator).toHaveCount(entriesToShow);
});

test.afterAll(async () => {
  await SeedClient.resetDatabase();
});
