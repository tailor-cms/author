import { expect, test } from '@playwright/test';

import AssetClient from '../../../api/AssetClient';
import { AssetLibrary } from '../../../pom/repository/AssetLibrary';
import { OutlineSidebar } from '../../../pom/repository/OutlineSidebar';
import SeedClient from '../../../api/SeedClient';
import { DOCUMENT, IMAGE } from '../../../fixtures/assets';
import { deferred } from '../../../helpers/deferred';
import { toFileMetaInput } from './helpers';

const INPUT_PLACEHOLDER = 'Click to add a thumbnail image';
const UPLOAD_ROUTE = '**/repositories/*/assets';

test.describe('FileInput - upload tab', () => {
  test('can upload a file via the upload tab', async ({ page }) => {
    await toFileMetaInput(page);
    const sidebar = new OutlineSidebar(page);
    const fileInput = await sidebar.openFileMeta(INPUT_PLACEHOLDER);
    await fileInput.picker.expectTabSelected(fileInput.picker.uploadTab);
    await fileInput.picker.uploadFile(IMAGE.path);
    await fileInput.expectFileSet(IMAGE.name);
    // Verify persistence
    await page.reload({ waitUntil: 'networkidle' });
    await fileInput.expectFileSet(IMAGE.name);
  });

  test('keeps the dialog open with progress while uploading', async ({
    page,
  }) => {
    await toFileMetaInput(page);
    // Hold the upload request so the in-flight state is observable
    const { promise: uploadGate, resolve: releaseUpload } = deferred();
    await page.route(UPLOAD_ROUTE, async (route) => {
      if (route.request().method() !== 'POST') return route.continue();
      await uploadGate;
      return route.continue();
    });
    const sidebar = new OutlineSidebar(page);
    const fileInput = await sidebar.openFileMeta(INPUT_PLACEHOLDER);
    await fileInput.picker.selectUploadFile(IMAGE.path);
    await fileInput.picker.expectUploading(IMAGE.name);
    releaseUpload();
    await fileInput.picker.waitForClose();
    await fileInput.expectFileSet(IMAGE.name);
  });

  test('shows an error and allows retry when the upload fails', async ({
    page,
  }) => {
    await toFileMetaInput(page);
    await page.route(UPLOAD_ROUTE, (route) => {
      if (route.request().method() !== 'POST') return route.continue();
      return route.fulfill({ status: 500, body: 'Upload error' });
    });
    const sidebar = new OutlineSidebar(page);
    const fileInput = await sidebar.openFileMeta(INPUT_PLACEHOLDER);
    await fileInput.picker.selectUploadFile(IMAGE.path);
    await expect(fileInput.picker.uploadError).toContainText('Upload failed');
    await expect(fileInput.picker.dialog).toBeVisible();
    // Retry succeeds once the failure is lifted
    await page.unroute(UPLOAD_ROUTE);
    await fileInput.picker.uploadFile(IMAGE.path);
    await fileInput.expectFileSet(IMAGE.name);
  });

  test('uploaded file appears in the asset library', async ({
    page,
  }) => {
    const repositoryId = await toFileMetaInput(page);
    const sidebar = new OutlineSidebar(page);
    const fileInput = await sidebar.openFileMeta(INPUT_PLACEHOLDER);
    await fileInput.picker.uploadFile(IMAGE.path);
    await fileInput.expectFileSet(IMAGE.name);
    const lib = new AssetLibrary(page);
    await lib.goto(repositoryId);
    await expect(lib.getRow(IMAGE.name).el).toBeVisible();
  });
});

test.describe('FileInput - library tab', () => {
  test('can select an asset from the library', async ({ page }) => {
    const repositoryId = await toFileMetaInput(page);
    await AssetClient.uploadFile(repositoryId, IMAGE.path);
    const sidebar = new OutlineSidebar(page);
    const fileInput = await sidebar.openFileMeta(INPUT_PLACEHOLDER);
    await fileInput.picker.selectAssetFromLibrary(IMAGE.name);
    await fileInput.expectFileSet(IMAGE.name);
  });

  test('library tab shows empty state when no assets', async ({ page }) => {
    await toFileMetaInput(page);
    const sidebar = new OutlineSidebar(page);
    const fileInput = await sidebar.openFileMeta(INPUT_PLACEHOLDER);
    await fileInput.picker.switchToLibrary();
    await fileInput.picker.expectEmptyLibrary();
  });

  test('picker only shows matching assets for image-only input', async ({
    page,
  }) => {
    const repositoryId = await toFileMetaInput(page);
    await AssetClient.uploadFile(repositoryId, IMAGE.path);
    await AssetClient.uploadFile(repositoryId, DOCUMENT.path);
    const sidebar = new OutlineSidebar(page);
    const { picker } = await sidebar.openFileMeta(INPUT_PLACEHOLDER);
    await picker.switchToLibrary();
    await expect(picker.libraryAssetList).toBeVisible();
    await expect(picker.getLibraryAssetItem(IMAGE.name)).toBeVisible();
    await expect(
      picker.getLibraryAssetItem(DOCUMENT.name),
    ).not.toBeVisible();
    await picker.cancel();
  });
});

test.describe('FileInput - general', () => {
  test('can cancel the picker dialog', async ({ page }) => {
    await toFileMetaInput(page);
    const sidebar = new OutlineSidebar(page);
    const fileInput = await sidebar.openFileMeta(INPUT_PLACEHOLDER);
    await fileInput.picker.cancel();
    await expect(sidebar.getMetaInput(INPUT_PLACEHOLDER)).toBeVisible();
  });
});

test.afterAll(async () => {
  await SeedClient.resetDatabase();
});
