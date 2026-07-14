import { expect, test } from '@playwright/test';

import ApiClient from '../../../api/ApiClient.ts';
import { AppBar } from '../../../pom/common/AppBar.ts';
import SeedClient from '../../../api/SeedClient.ts';
import { createCleanRepository, toEmptyRepository } from '../../../helpers/seed.ts';

const repositoryApi = new ApiClient('/api/repositories/');

test.beforeEach(async () => {
  await SeedClient.resetDatabase();
});

test('pins the current repository at the top of the switcher', async ({
  page,
}) => {
  const name = 'Current Repository';
  await toEmptyRepository(page, name);
  const appBar = new AppBar(page);
  await appBar.openRepositorySwitcher();
  const firstItem = appBar.repositoryItems().first();
  await expect(firstItem).toContainText(name);
  await expect(firstItem).toHaveClass(/v-list-item--active/);
  await expect(firstItem.locator('.mdi-check')).toBeVisible();
});

test('searches for a repository and switches to it', async ({ page }) => {
  const targetName = 'Target Repository';
  // Created but never visited, so it surfaces only through search.
  const target = await createCleanRepository(targetName);
  await toEmptyRepository(page, 'Current Repository');
  const appBar = new AppBar(page);
  await appBar.openRepositorySwitcher();
  await expect(appBar.repositoryItem(targetName)).toHaveCount(0);
  await appBar.searchRepositories(targetName);
  await expect(appBar.repositoryItem(targetName)).toBeVisible();
  await appBar.switchToRepository(targetName);
  await expect(page).toHaveURL(new RegExp(`/repository/${target.id}(/|$)`));
});

test('lists a previously visited repository as recent', async ({ page }) => {
  const recentName = 'Recent Repository';
  await toEmptyRepository(page, recentName);
  await toEmptyRepository(page, 'Current Repository');
  const appBar = new AppBar(page);
  await appBar.openRepositorySwitcher();
  const recentItem = appBar.repositoryItem(recentName);
  await expect(recentItem).toBeVisible();
  await expect(recentItem.locator('.mdi-history')).toBeVisible();
});

test('drops a deleted repository from recents', async ({ page }) => {
  const deletedName = 'Deleted Repository';
  // Visited so it is recorded as recent, then deleted server-side.
  const deleted = await toEmptyRepository(page, deletedName);
  await toEmptyRepository(page, 'Current Repository');
  await repositoryApi.remove(deleted.id);
  const appBar = new AppBar(page);
  await appBar.openRepositorySwitcher();
  await expect(appBar.repositoryItem(deletedName)).toHaveCount(0);
});

test.afterAll(async () => {
  await SeedClient.resetDatabase();
});
