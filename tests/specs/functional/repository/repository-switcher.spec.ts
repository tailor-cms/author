import { expect, test } from '@playwright/test';

import ApiClient from '../../../api/ApiClient.ts';
import { AppBar } from '../../../pom/common/AppBar.ts';
import SeedClient from '../../../api/SeedClient.ts';
import {
  createCleanRepository,
  RECENT_MIN_VISIT_MS,
  seedRecentRepositories,
  toEmptyRepository,
} from '../../../helpers/seed.ts';

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
  // A visit only counts as recent past the minimum visit; advance the clock
  // instead of waiting on wall-clock load time (what made this flake by env).
  await page.clock.install();
  await toEmptyRepository(page, recentName);
  await page.clock.fastForward(RECENT_MIN_VISIT_MS + 1_000);
  await toEmptyRepository(page, 'Current Repository');
  const appBar = new AppBar(page);
  await appBar.openRepositorySwitcher();
  const recentItem = appBar.repositoryItem(recentName);
  await expect(recentItem).toBeVisible();
  await expect(recentItem.locator('.mdi-history')).toBeVisible();
});

test('drops a deleted repository from recents', async ({ page }) => {
  const deletedName = 'Deleted Repository';
  const deleted = await createCleanRepository(deletedName);
  await seedRecentRepositories(page, [deleted.id]);
  await toEmptyRepository(page, 'Current Repository');
  const appBar = new AppBar(page);
  // It lists as a genuine recent while the repository exists...
  await appBar.openRepositorySwitcher();
  await expect(appBar.repositoryItem(deletedName)).toBeVisible();
  // ...and the switcher prunes it once the repository is gone server-side.
  await repositoryApi.remove(deleted.id);
  await appBar.closeRepositorySwitcher();
  await appBar.openRepositorySwitcher();
  await expect(appBar.repositoryItem(deletedName)).toHaveCount(0);
});

test('removes a repository from recents', async ({ page }) => {
  const recentName = 'Recent Repository';
  const keptName = 'Kept Repository';
  const recent = await createCleanRepository(recentName);
  const kept = await createCleanRepository(keptName);
  await seedRecentRepositories(page, [recent.id, kept.id]);
  await toEmptyRepository(page, 'Current Repository');
  const appBar = new AppBar(page);
  await appBar.openRepositorySwitcher();
  await expect(appBar.repositoryItem(recentName)).toBeVisible();
  await appBar.removeRecent(recentName);
  await expect(appBar.repositoryItem(recentName)).toHaveCount(0);
  // Other recents are untouched.
  await expect(appBar.repositoryItem(keptName)).toBeVisible();
});

test('offers removal only for recents', async ({ page }) => {
  const searchName = 'Searchable Repository';
  // Created but never visited, so it surfaces only through search.
  await createCleanRepository(searchName);
  await toEmptyRepository(page, 'Current Repository');
  const appBar = new AppBar(page);
  await appBar.openRepositorySwitcher();
  // The pinned current repository is not a removable recent.
  await expect(appBar.recentRemoveButton('Current Repository')).toHaveCount(0);
  // Neither are search results.
  await appBar.searchRepositories(searchName);
  await expect(appBar.repositoryItem(searchName)).toBeVisible();
  await expect(appBar.recentRemoveButton(searchName)).toHaveCount(0);
});

test.afterAll(async () => {
  await SeedClient.resetDatabase();
});
