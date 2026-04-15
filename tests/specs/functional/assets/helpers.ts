import type { Page } from '@playwright/test';

import SeedClient from '../../../api/SeedClient';
import { AssetLibrary } from '../../../pom/repository/AssetLibrary';
import {
  toRepositoryAssets,
  toSeededRepository,
} from '../../../helpers/seed';

// Reset DB and seed a repository. Returns repositoryId (no page navigation).
export async function createRepository() {
  await SeedClient.resetDatabase();
  const { data } = await SeedClient.seedTestRepository();
  return data.repository.id as number;
}

// Seed a repository and navigate to the assets page.
export async function toAssetLibrary(page: Page) {
  await SeedClient.resetDatabase();
  const repository = await toRepositoryAssets(page);
  return { repositoryId: repository.id, lib: new AssetLibrary(page) };
}

// Seed assets via API, navigate to asset library, and reload to pick them up.
export async function toSeededAssetLibrary(
  page: Page,
  seed: (repositoryId: number) => Promise<any>,
) {
  const { repositoryId, lib } = await toAssetLibrary(page);
  await seed(repositoryId);
  await page.reload({ waitUntil: 'networkidle' });
  await lib.waitForLoad();
  return { repositoryId, lib };
}

// Seed a repository, navigate to structure page.
// The seed auto-selects the first module, opening the sidebar
// with meta inputs including a File input (thumbnail).
export async function toFileMetaInput(page: Page) {
  await SeedClient.resetDatabase();
  const { repository } = await toSeededRepository(page);
  await page.waitForLoadState('networkidle');
  return repository.id;
}
