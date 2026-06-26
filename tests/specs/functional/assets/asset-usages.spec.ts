// "Where is this asset used"; an on-demand scan that reports every reference
// to an asset across content elements, activity meta and repository meta, shown
// in the asset library sidebar.
import { expect, test } from '@playwright/test';

import { AssetLibrary } from '../../../pom/repository/AssetLibrary';
import { IMAGE } from '../../../fixtures/assets';
import { toRepositoryAssets } from '../../../helpers/seed';
import AssetClient from '../../../api/AssetClient';
import SeedClient from '../../../api/SeedClient';

test.beforeEach(async ({ page }) => {
  await SeedClient.resetDatabase();
  await page.goto('/');
});

test('lists asset usages in the library sidebar', async ({ page }) => {
  // pizza.tgz references an image at element, repository and activity level.
  await toRepositoryAssets(page);
  const library = new AssetLibrary(page);
  await expect(library.assetRows.first()).toBeVisible();
  const [firstRow] = await library.getRows();
  await firstRow.openDetail();
  const sidebar = library.sidebar;
  await sidebar.waitForOpen();
  await expect(sidebar.usages).toBeVisible();
  await expect(sidebar.usageRows.first()).toBeVisible();
});

test('asset usages query is injection-safe', async () => {
  const { data: seed } = await SeedClient.seedTestRepository();
  const { repository } = seed;
  // The upload filename flows into the storage key, which findUsages substring-
  // matches inside JSONB. An unescaped single quote would break the SQL (500)
  // or inject;
  const filename = 'x\'); DROP TABLE asset; --.png';
  const upload = await AssetClient.uploadFile(
    repository.id, IMAGE.path, { name: filename },
  );
  const asset = upload.data[0];
  expect(asset.storageKey).toContain('\'');
  const usages = await AssetClient.getUsages(repository.id, asset.id);
  expect(usages.status).toBe(200);
  // Table intact
  const list = await AssetClient.list(repository.id);
  expect(list.status).toBe(200);
});

test.afterAll(async () => {
  await SeedClient.resetDatabase();
});
