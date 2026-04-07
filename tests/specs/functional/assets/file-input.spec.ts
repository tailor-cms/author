import { expect, test } from '@playwright/test';

import AssetClient from '../../../api/AssetClient';
import { AssetLibrary } from '../../../pom/repository/AssetLibrary';
import { OutlineSidebar } from '../../../pom/repository/OutlineSidebar';
import SeedClient from '../../../api/SeedClient';
import { DOCUMENT, IMAGE } from '../../../fixtures/assets';
import { toFileMetaInput } from './helpers';

const INPUT_PLACEHOLDER = 'Click to add a thumbnail image';

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
    // Verify download
    const download = await fileInput.download(IMAGE.name);
    expect(download.suggestedFilename()).toContain(IMAGE.name);
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
    await expect(
      fileInput.picker.dialog.getByText('No assets found'),
    ).toBeVisible();
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

  test('picker only shows matching assets for image-only input', async ({
    page,
  }) => {
    const repositoryId = await toFileMetaInput(page);
    await AssetClient.uploadFile(repositoryId, IMAGE.path);
    await AssetClient.uploadFile(repositoryId, DOCUMENT.path);
    const sidebar = new OutlineSidebar(page);
    const fileInput = await sidebar.openFileMeta(INPUT_PLACEHOLDER);
    const { picker } = fileInput;
    await picker.switchToLibrary();
    await expect(picker.libraryAssetList).toBeVisible();
    await expect(picker.getLibraryAssetItem(IMAGE.name)).toBeVisible();
    await expect(
      picker.getLibraryAssetItem(DOCUMENT.name),
    ).not.toBeVisible();
    await picker.cancel();
  });
});

test.afterAll(async () => {
  await SeedClient.resetDatabase();
});
