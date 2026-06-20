// `pizza.tgz` is a real archive exported with the asset-aware transfer code. It
// bundles image assets referenced at every level: a content element
// (`data.assets`), a repository-level `posterImage` File meta, and an
// activity-level `thumbnail` File meta. Importing it must register all of them
// in the repository Asset Library.
import { expect, test } from '@playwright/test';
import { AssetLibrary } from '../../../pom/repository/AssetLibrary';
import { toRepositoryAssets } from '../../../helpers/seed';
import SeedClient from '../../../api/SeedClient';

test.beforeEach(async ({ page }) => {
  await SeedClient.resetDatabase();
  await page.goto('/');
});

test('registers element & meta-level assets in the library on import',
  async ({ page }) => {
    await toRepositoryAssets(page);
    const library = new AssetLibrary(page);
    await library.waitForLoad();
    // Three bundled images get registered: an element image (data.assets), the
    // repository `posterImage` meta, and an activity `thumbnail` meta.
    await library.expectRowCount(3);
    const rows = await library.getRows();
    for (const row of rows) await expect(row.typeChip).toContainText('Image');
    await expect(page.getByText('Avatar', { exact: true }).first()).toBeVisible();
  },
);

test.afterAll(async () => {
  await SeedClient.resetDatabase();
});
