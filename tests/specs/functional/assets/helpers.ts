import type { Page } from '@playwright/test';

import { createCleanRepository, outlineLevel } from '../../../helpers/seed';
import { AssetLibrary } from '../../../pom/repository/AssetLibrary';
import { ActivityOutline } from '../../../pom/repository/Outline';
import SeedClient from '../../../api/SeedClient';

// Reset DB and create a blank repository. Returns repositoryId (no navigation).
export async function createRepository() {
  await SeedClient.resetDatabase();
  const repository = await createCleanRepository();
  return repository.id as number;
}

// Create a blank repository and navigate to its (empty) asset library.
export async function toAssetLibrary(page: Page) {
  await SeedClient.resetDatabase();
  const repository = await createCleanRepository();
  await page.goto(`/repository/${repository.id}/root/assets`);
  await page.waitForLoadState('networkidle');
  return { repositoryId: repository.id as number, lib: new AssetLibrary(page) };
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

// Create a blank repository with a single empty module, then select it so the
// structure sidebar shows an unset `thumbnail` File meta.
export async function toFileMetaInput(page: Page) {
  await SeedClient.resetDatabase();
  const repository = await createCleanRepository();
  await page.goto(`/repository/${repository.id}/root/structure`);
  await page.waitForLoadState('networkidle');
  const outline = new ActivityOutline(page);
  const module = await outline.addRootItem(outlineLevel.GROUP, 'Module 1');
  await module.select();
  return repository.id as number;
}
