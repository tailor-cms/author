import { test } from '@playwright/test';

import { RepositoryUsers } from '../../../pom/repository/RepositorySettings.ts';
import SeedClient from '../../../api/SeedClient.ts';
import { toEmptyRepository } from '../../../helpers/seed.ts';

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

test.afterAll(async () => {
  await SeedClient.resetDatabase();
});
