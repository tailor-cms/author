import { expect, test } from '@playwright/test';

import { AUDIO, DOCUMENT, IMAGE, VIDEO } from '../../../fixtures/assets';
import AssetClient from '../../../api/AssetClient';
import SeedClient from '../../../api/SeedClient';
import { toAssetLibrary, toSeededAssetLibrary } from './helpers';

test.describe('Asset library', () => {
  test('displays empty state when no assets exist', async ({ page }) => {
    const { lib } = await toAssetLibrary(page);
    await lib.waitForLoad();
    await expect(lib.emptyState).toBeVisible();
    await expect(lib.emptyState).toContainText('No assets uploaded yet.');
    await expect(lib.emptyState).toContainText(
      'Upload files, add links, or use Discover.',
    );
  });

  test('can upload an image file', async ({ page }) => {
    const { lib } = await toAssetLibrary(page);
    await lib.uploadAndVerify(IMAGE.path, IMAGE.name, 'image');
  });

  test('can upload a document file', async ({ page }) => {
    const { lib } = await toAssetLibrary(page);
    await lib.uploadAndVerify(DOCUMENT.path, DOCUMENT.name, 'document');
  });

  test('can upload a video file', async ({ page }) => {
    const { lib } = await toAssetLibrary(page);
    await lib.uploadAndVerify(VIDEO.path, VIDEO.name, 'video');
  });

  test('can upload an audio file', async ({ page }) => {
    const { lib } = await toAssetLibrary(page);
    await lib.uploadAndVerify(AUDIO.path, AUDIO.name, 'audio');
  });

  test('can upload multiple files at once', async ({ page }) => {
    const { lib } = await toAssetLibrary(page);
    await lib.uploadFiles([IMAGE.path, DOCUMENT.path]);
    await expect(lib.assetRows).toHaveCount(2);
    await page.reload({ waitUntil: 'networkidle' });
    await lib.waitForLoad();
    await expect(lib.assetRows).toHaveCount(2);
  });

  test('can add a link', async ({ page }) => {
    const { lib } = await toAssetLibrary(page);
    await lib.addLink('https://docs.tailor-cms.com');
    const row = lib.getRow('Tailor Author');
    await expect(row.el).toBeVisible();
    await expect(row.typeChip).toContainText('link');
    await row.openMenu();
    await expect(row.downloadMenuItem).not.toBeVisible();
    await page.reload({ waitUntil: 'networkidle' });
    await lib.waitForLoad();
    await expect(lib.getRow('Tailor Author').el).toBeVisible();
  });

  test('can add a YouTube link (classified as video)', async ({ page }) => {
    const { lib } = await toAssetLibrary(page);
    await lib.addLink('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    await lib.waitForLoad();
    const rows = await lib.getRows();
    expect(rows.length).toBeGreaterThanOrEqual(1);
    await expect(rows[0].typeChip).toContainText('YouTube');
  });

  test('can filter assets by category', async ({ page }) => {
    const { lib } = await toSeededAssetLibrary(page, async (id) => {
      await AssetClient.uploadFile(id, IMAGE.path);
      await AssetClient.addLink(id, 'https://docs.tailor-cms.com');
      await AssetClient.addLink(id, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    });
    await lib.expectRowCount(3);

    await lib.filterByCategory('Images');
    await lib.expectRowCount(1);
    await expect(lib.getRow(IMAGE.name).el).toBeVisible();

    // YouTube links should appear under Video, not Links
    await lib.filterByCategory('Video');
    await lib.expectRowCount(1);

    // Regular links only (YouTube excluded)
    await lib.filterByCategory('Links');
    await lib.expectRowCount(1);
    await expect(lib.getRow('Tailor Author').el).toBeVisible();

    await lib.filterByCategory('All');
    await lib.expectRowCount(3);
  });

  test('can search assets by name', async ({ page }) => {
    const { lib } = await toSeededAssetLibrary(page, async (id) => {
      await AssetClient.uploadFile(id, IMAGE.path);
      await AssetClient.uploadFile(id, DOCUMENT.path);
    });
    await lib.expectRowCount(2);

    await lib.toolbar.searchInput.fill('test-image');
    await lib.expectRowCount(1);
    await expect(lib.getRow(IMAGE.name).el).toBeVisible();
  });

  test('can delete a single asset', async ({ page }) => {
    const { lib } = await toSeededAssetLibrary(page, (id) =>
      AssetClient.uploadFile(id, IMAGE.path),
    );
    await lib.getRow(IMAGE.name).delete();
    await lib.waitForLoad();
    await expect(lib.emptyState).toBeVisible();
    await page.reload({ waitUntil: 'networkidle' });
    await lib.waitForLoad();
    await expect(lib.emptyState).toBeVisible();
  });

  test('can select and deselect assets', async ({ page }) => {
    const { lib } = await toSeededAssetLibrary(page, async (id) => {
      await AssetClient.uploadFile(id, IMAGE.path);
      await AssetClient.uploadFile(id, DOCUMENT.path);
    });

    await lib.getRow(IMAGE.name).select();
    await expect(lib.bulkActionBar.selectionChip).toContainText('1 selected');

    await lib.bulkActionBar.selectAll();
    await expect(lib.bulkActionBar.selectionChip).toContainText('2 selected');

    await lib.bulkActionBar.deselectAll();
    await expect(lib.bulkActionBar.el).not.toBeVisible();
  });

  test('can bulk delete assets', async ({ page }) => {
    const { lib } = await toSeededAssetLibrary(page, async (id) => {
      await AssetClient.uploadFile(id, IMAGE.path);
      await AssetClient.uploadFile(id, DOCUMENT.path);
    });
    await lib.expectRowCount(2);

    await lib.getRow(IMAGE.name).select();
    await lib.bulkActionBar.selectAll();
    await lib.bulkActionBar.deleteSelected();
    await lib.waitForLoad();
    await expect(lib.emptyState).toBeVisible();
    await page.reload({ waitUntil: 'networkidle' });
    await lib.waitForLoad();
    await expect(lib.emptyState).toBeVisible();
  });

  test('can open asset detail dialog', async ({ page }) => {
    const { lib } = await toSeededAssetLibrary(page, (id) =>
      AssetClient.uploadFile(id, IMAGE.path),
    );
    await lib.getRow(IMAGE.name).openDetail();
    const detail = lib.detailDialog;
    await detail.waitForOpen();
    await expect(detail.descriptionInput).toBeVisible();
    await expect(detail.tagsInput).toBeVisible();
    await expect(detail.deleteBtn).toBeVisible();
    await detail.close();
  });

  test('can edit asset description in detail dialog', async ({ page }) => {
    const { lib } = await toSeededAssetLibrary(page, (id) =>
      AssetClient.uploadFile(id, IMAGE.path),
    );
    await lib.getRow(IMAGE.name).openDetail();
    const detail = lib.detailDialog;
    await detail.waitForOpen();
    await detail.editDescription('A test image for e2e tests');
    await detail.save();
    await expect(detail.el).not.toBeVisible();
    // Verify persistence after reload
    await page.reload({ waitUntil: 'networkidle' });
    await lib.waitForLoad();
    await lib.getRow(IMAGE.name).openDetail();
    await detail.waitForOpen();
    await expect(detail.descriptionInput).toHaveValue(
      'A test image for e2e tests',
    );
    await detail.close();
  });

  test('can add tags in detail dialog', async ({ page }) => {
    const { lib } = await toSeededAssetLibrary(page, (id) =>
      AssetClient.uploadFile(id, IMAGE.path),
    );
    await lib.getRow(IMAGE.name).openDetail();
    const detail = lib.detailDialog;
    await detail.waitForOpen();
    await detail.addTag('e2e-test');
    await detail.addTag('screenshot');
    await detail.save();
    await expect(detail.el).not.toBeVisible();
    // Verify persistence after reload
    await page.reload({ waitUntil: 'networkidle' });
    await lib.waitForLoad();
    await lib.getRow(IMAGE.name).openDetail();
    await detail.waitForOpen();
    await expect(detail.el.getByText('e2e-test')).toBeVisible();
    await expect(detail.el.getByText('screenshot')).toBeVisible();
    await detail.close();
  });

  test('can download an asset', async ({ page }) => {
    const { lib } = await toSeededAssetLibrary(page, (id) =>
      AssetClient.uploadFile(id, IMAGE.path),
    );
    const row = lib.getRow(IMAGE.name);
    const [popup] = await Promise.all([
      page.waitForEvent('popup'),
      row.download(),
    ]);
    expect(popup.url()).toBeTruthy();
    await popup.close();
  });

  test('add link dialog rejects invalid URL', async ({ page }) => {
    const { lib } = await toAssetLibrary(page);
    await lib.toolbar.addLinkBtn.click();
    await expect(lib.addLinkDialog.el).toBeVisible();
    await lib.addLinkDialog.urlInput.fill('not-a-url');
    await expect(lib.addLinkDialog.addBtn).toBeDisabled();
  });
});

test.afterAll(async () => {
  await SeedClient.resetDatabase();
});
