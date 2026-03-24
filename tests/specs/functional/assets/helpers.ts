import type { Page } from '@playwright/test';

import SeedClient from '../../../api/SeedClient';
import { AssetLibrary } from '../../../pom/repository/AssetLibrary';
import { toRepositoryAssets, toSeededRepository } from '../../../helpers/seed';

// Seed a repository and navigate to the assets page.
export async function setupAssetLibrary(page: Page) {
  await SeedClient.resetDatabase();
  const repository = await toRepositoryAssets(page);
  return { repositoryId: repository.id, lib: new AssetLibrary(page) };
}

// Setup asset library, seed assets via API, reload to pick them up.
export async function seedAndReload(
  page: Page,
  seed: (repositoryId: number) => Promise<any>,
) {
  const { repositoryId, lib } = await setupAssetLibrary(page);
  await seed(repositoryId);
  await page.reload({ waitUntil: 'networkidle' });
  await lib.waitForLoad();
  return { repositoryId, lib };
}

// Seed a repository, navigate to structure, and open an activity sidebar.
export async function setupFileMetaInput(page: Page) {
  await SeedClient.resetDatabase();
  const { repository } = await toSeededRepository(page);
  await page.waitForLoadState('networkidle');
  const firstItem = page.locator('.activity-item').first();
  if (await firstItem.isVisible()) await firstItem.click();
  await page.waitForLoadState('networkidle');
  return repository.id;
}
