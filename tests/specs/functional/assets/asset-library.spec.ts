import { expect, test } from '@playwright/test';

import { AUDIO, DOCUMENT, IMAGE, VIDEO } from '../../../fixtures/assets';
import {
  createRepository,
  toAssetLibrary,
  toSeededAssetLibrary,
} from './helpers';
import { AssetLibrary } from '../../../pom/repository/AssetLibrary';
import { expectAlert } from '../../../pom/common/utils';
import AssetClient from '../../../api/AssetClient';
import SeedClient from '../../../api/SeedClient';

const YOUTUBE_ID = 'dQw4w9WgXcQ';
const YOUTUBE_LINK = `https://www.youtube.com/watch?v=${YOUTUBE_ID}`;

test.describe('Asset library', () => {
  test('displays empty state when no assets exist', async ({ page }) => {
    const { lib } = await toAssetLibrary(page);
    await lib.waitForLoad();
    await expect(lib.emptyLibrary).toBeVisible();
    await expect(lib.toolbar.el).toBeHidden();
    await expect(lib.emptyUploadCard).toBeVisible();
    await expect(lib.emptyAddLinkCard).toBeVisible();
    await expect(lib.folders.emptyNewFolderCard).toBeVisible();
  });

  test('can upload an image file', async ({ page }) => {
    const { lib } = await toAssetLibrary(page);
    await lib.uploadAndVerify(IMAGE.path, IMAGE.name, 'Image');
  });

  test('can upload a document file', async ({ page }) => {
    const { lib } = await toAssetLibrary(page);
    await lib.uploadAndVerify(DOCUMENT.path, DOCUMENT.name, 'Document');
  });

  test('can upload a video file', async ({ page }) => {
    const { lib } = await toAssetLibrary(page);
    await lib.uploadAndVerify(VIDEO.path, VIDEO.name, 'Video');
  });

  test('can upload an audio file', async ({ page }) => {
    const { lib } = await toAssetLibrary(page);
    await lib.uploadAndVerify(AUDIO.path, AUDIO.name, 'Audio');
  });

  test('can upload multiple files at once', async ({ page }) => {
    const { lib } = await toAssetLibrary(page);
    await lib.uploadFirst([IMAGE.path, DOCUMENT.path]);
    await expect(lib.assetRows).toHaveCount(2);
    await page.reload({ waitUntil: 'networkidle' });
    await lib.waitForLoad();
    await expect(lib.assetRows).toHaveCount(2);
  });

  test('can add a link', async ({ page }) => {
    const { lib } = await toAssetLibrary(page);
    await lib.addFirstLink('https://docs.tailor-cms.com');
    const row = lib.getRow('Tailor Author');
    await expect(row.el).toBeVisible();
    await expect(row.typeChip).toContainText('Link');
    await row.openMenu();
    await expect(row.downloadMenuItem).not.toBeVisible();
    await page.reload({ waitUntil: 'networkidle' });
    await lib.waitForLoad();
    await expect(lib.getRow('Tailor Author').el).toBeVisible();
  });

  test('can add a YouTube link (classified as video)', async ({ page }) => {
    const { lib } = await toAssetLibrary(page);
    await lib.addFirstLink(YOUTUBE_LINK);
    await lib.waitForLoad();
    const rows = await lib.getRows();
    expect(rows.length).toBeGreaterThanOrEqual(1);
    await expect(rows[0].typeChip).toContainText('YouTube');
  });

  test('starts a video link playing on demand', async ({ page }) => {
    // Answer YouTube requests with an empty page, so nothing loads from it
    const youtube = /^https:\/\/[^/]*youtube\.com\//;
    await page.route(youtube, (route) => route.fulfill({ body: '' }));
    const { lib } = await toSeededAssetLibrary(page, (id) =>
      AssetClient.addLink(id, YOUTUBE_LINK),
    );
    const [row] = await lib.getRows();
    await row.openDetail();
    await lib.sidebar.waitForOpen();
    const { embedPoster, embedFrame } = lib.sidebar;
    await expect(embedPoster).toBeVisible();
    await expect(embedFrame).toHaveCount(0);
    await embedPoster.click();
    // Checks the iframe our code adds, not what YouTube plays inside it
    await expect(embedFrame).toHaveAttribute(
      'src',
      `https://www.youtube.com/embed/${YOUTUBE_ID}?autoplay=1`,
    );
    await expect(embedFrame).toHaveAttribute('allow', /\bautoplay\b/);
  });

  test('opens a linked asset nested inside a folder', async ({ page }) => {
    const repositoryId = await createRepository();
    const { data } = await AssetClient.uploadFile(repositoryId, IMAGE.path, {
      folder: 'photos',
    });
    const lib = await AssetLibrary.visit(page, repositoryId, {
      assetId: data[0].id,
    });
    await lib.sidebar.waitForOpen();
    await page.waitForLoadState('networkidle');
    await expect(lib.sidebar.nameInput).toHaveValue(/test-image/);
    await expect(lib.folders.breadcrumbs).toContainText('photos');
    await expect(page).not.toHaveURL(/assetId/);
  });

  test('shows an alert when a linked asset is gone', async ({ page }) => {
    const repositoryId = await createRepository();
    await AssetLibrary.visit(page, repositoryId, { assetId: 999999 });
    await expectAlert(page, 'That asset is no longer available');
  });

  test('can filter assets by category', async ({ page }) => {
    const { lib } = await toSeededAssetLibrary(page, async (id) => {
      await AssetClient.uploadFile(id, IMAGE.path);
      await AssetClient.addLink(id, 'https://docs.tailor-cms.com');
      await AssetClient.addLink(id, YOUTUBE_LINK);
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
    await expect(lib.emptyLibrary).toBeVisible();
    await page.reload({ waitUntil: 'networkidle' });
    await lib.waitForLoad();
    await expect(lib.emptyLibrary).toBeVisible();
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
    await expect(lib.emptyLibrary).toBeVisible();
    await page.reload({ waitUntil: 'networkidle' });
    await lib.waitForLoad();
    await expect(lib.emptyLibrary).toBeVisible();
  });

  test('can open asset detail sidebar', async ({ page }) => {
    const { lib } = await toSeededAssetLibrary(page, (id) =>
      AssetClient.uploadFile(id, IMAGE.path),
    );
    await lib.getRow(IMAGE.name).openDetail();
    const sidebar = lib.sidebar;
    await sidebar.waitForOpen();
    await expect(sidebar.descriptionInput).toBeVisible();
    await expect(sidebar.tagsInput).toBeVisible();
    await expect(sidebar.actionsBtn).toBeVisible();
    await sidebar.close();
  });

  test('can edit asset description in detail sidebar', async ({ page }) => {
    const { lib } = await toSeededAssetLibrary(page, (id) =>
      AssetClient.uploadFile(id, IMAGE.path),
    );
    await lib.getRow(IMAGE.name).openDetail();
    const sidebar = lib.sidebar;
    await sidebar.waitForOpen();
    await sidebar.editDescription('A test image for e2e tests');
    await sidebar.save();
    await expect(sidebar.closeBtn).not.toBeVisible();
    // Verify persistence after reload
    await page.reload({ waitUntil: 'networkidle' });
    await lib.waitForLoad();
    await lib.getRow(IMAGE.name).openDetail();
    await sidebar.waitForOpen();
    await expect(sidebar.descriptionInput).toHaveValue(
      'A test image for e2e tests',
    );
    await sidebar.close();
  });

  test('can add tags in detail sidebar', async ({ page }) => {
    const { lib } = await toSeededAssetLibrary(page, (id) =>
      AssetClient.uploadFile(id, IMAGE.path),
    );
    await lib.getRow(IMAGE.name).openDetail();
    const sidebar = lib.sidebar;
    await sidebar.waitForOpen();
    await sidebar.addTag('e2e-test');
    await sidebar.addTag('screenshot');
    await sidebar.save();
    await expect(sidebar.closeBtn).not.toBeVisible();
    // Verify persistence after reload
    await page.reload({ waitUntil: 'networkidle' });
    await lib.waitForLoad();
    await lib.getRow(IMAGE.name).openDetail();
    await sidebar.waitForOpen();
    await expect(sidebar.el.getByText('e2e-test')).toBeVisible();
    await expect(sidebar.el.getByText('screenshot')).toBeVisible();
    await sidebar.close();
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
    await lib.emptyAddLinkCard.click();
    await expect(lib.addLinkDialog.el).toBeVisible();
    await lib.addLinkDialog.urlInput.fill('not-a-url');
    await lib.addLinkDialog.addBtn.click();
    // Dialog stays open and surfaces a validation error
    await expect(lib.addLinkDialog.el).toBeVisible();
    await expect(lib.addLinkDialog.el).toContainText('Please enter a valid URL');
  });
});

test.afterAll(async () => {
  await SeedClient.resetDatabase();
});
