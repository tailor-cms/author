import { test } from '@playwright/test';

import AssetClient from '../../api/AssetClient';
import SeedClient from '../../api/SeedClient';
import { DOCUMENT, IMAGE } from '../../fixtures/assets';
import { AssetLibrary } from '../../pom/repository/AssetLibrary';
import { percySnapshot } from '../../utils/percy';
import { toRepositoryAssets } from '../../helpers/seed';

const REPOSITORY_NAME = 'Asset Library Visual Tests';

test('Asset library - populated list', async ({ page }) => {
  const repository = await toRepositoryAssets(page, REPOSITORY_NAME);
  await AssetClient.uploadFile(repository.id, IMAGE.path);
  await AssetClient.uploadFile(repository.id, DOCUMENT.path);
  await AssetClient.addLink(repository.id, 'https://docs.tailor-cms.com');
  await page.reload({ waitUntil: 'networkidle' });
  const lib = new AssetLibrary(page);
  await lib.waitForLoad();
  await percySnapshot(page, 'Asset library - populated list');
});

test('Asset library - empty state', async ({ page }) => {
  await toRepositoryAssets(page, REPOSITORY_NAME);
  const lib = new AssetLibrary(page);
  await lib.waitForLoad();
  await percySnapshot(page, 'Asset library - empty state');
});

test('Asset library - detail dialog', async ({ page }) => {
  const repository = await toRepositoryAssets(page, REPOSITORY_NAME);
  await AssetClient.uploadFile(repository.id, IMAGE.path);
  await page.reload({ waitUntil: 'networkidle' });
  const lib = new AssetLibrary(page);
  await lib.waitForLoad();
  await lib.getRow(IMAGE.name).openDetail();
  await lib.detailDialog.waitForOpen();
  await percySnapshot(page, 'Asset library - detail dialog');
});

test('Asset library - add link dialog', async ({ page }) => {
  await toRepositoryAssets(page, REPOSITORY_NAME);
  const lib = new AssetLibrary(page);
  await lib.toolbar.addLinkBtn.click();
  await percySnapshot(page, 'Asset library - add link dialog');
});

test.afterAll(async () => {
  await SeedClient.resetDatabase();
});
