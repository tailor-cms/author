import { expect, test } from '@playwright/test';

import { AppBar } from '../../../pom/common/AppBar.ts';
import SeedClient from '../../../api/SeedClient.ts';
import { createCleanRepository, toEmptyRepository } from '../../../helpers/seed.ts';

const uniqueName = (label: string) =>
  `${label} ${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

test.beforeEach(async () => {
  await SeedClient.resetDatabase();
});

test('pins the current repository at the top of the switcher', async ({
  page,
}) => {
  const name = uniqueName('Switcher Current');
  await toEmptyRepository(page, name);
  const appBar = new AppBar(page);
  await appBar.openRepositorySwitcher();
  const firstItem = appBar.repositoryItems().first();
  await expect(firstItem).toContainText(name);
  await expect(firstItem).toHaveClass(/v-list-item--active/);
  await expect(firstItem.locator('.mdi-check')).toBeVisible();
});

test('searches for a repository and switches to it', async ({ page }) => {
  const targetName = uniqueName('Switcher Target');
  // Created but never visited, so it surfaces only through search.
  const target = await createCleanRepository(targetName);
  await toEmptyRepository(page, uniqueName('Switcher Current'));
  const appBar = new AppBar(page);
  await appBar.openRepositorySwitcher();
  await expect(appBar.repositoryItem(targetName)).toHaveCount(0);
  await appBar.searchRepositories(targetName);
  await expect(appBar.repositoryItem(targetName)).toBeVisible();
  await appBar.switchToRepository(targetName);
  await expect(page).toHaveURL(new RegExp(`/repository/${target.id}(/|$)`));
});

test('lists a previously visited repository as recent', async ({ page }) => {
  const recentName = uniqueName('Switcher Recent');
  await toEmptyRepository(page, recentName);
  await toEmptyRepository(page, uniqueName('Switcher Current'));
  const appBar = new AppBar(page);
  await appBar.openRepositorySwitcher();
  const recentItem = appBar.repositoryItem(recentName);
  await expect(recentItem).toBeVisible();
  await expect(recentItem.locator('.mdi-history')).toBeVisible();
});

test.afterAll(async () => {
  await SeedClient.resetDatabase();
});
