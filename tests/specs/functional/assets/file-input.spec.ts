import { expect, test } from '@playwright/test';

import AssetClient from '../../../api/AssetClient';
import { AssetLibrary } from '../../../pom/repository/AssetLibrary';
import { FileInputPicker } from '../../../pom/common/FileInputPicker';
import { OutlineSidebar } from '../../../pom/repository/OutlineSidebar';
import SeedClient from '../../../api/SeedClient';
import { DOCUMENT, IMAGE } from '../../../fixtures/assets';
import { toFileMetaInput } from './helpers';

const INPUT_PLACEHOLDER = 'Click to add a thumbnail image';

test.describe('FileInput - upload tab', () => {
  test('can upload a file via the upload tab', async ({ page }) => {
    await toFileMetaInput(page);
    const sidebar = new OutlineSidebar(page);
    await sidebar.openFileInput(INPUT_PLACEHOLDER);
    const picker = new FileInputPicker(page);
    await picker.waitForOpen();
    await expect(picker.uploadTab).toHaveAttribute(
      'aria-selected', 'true',
    );
    await picker.uploadFile(IMAGE.path);
    await page.waitForLoadState('networkidle');
  });

  test('uploaded file appears in the asset library', async ({
    page,
  }) => {
    const repositoryId = await toFileMetaInput(page);
    const sidebar = new OutlineSidebar(page);
    await sidebar.openFileInput(INPUT_PLACEHOLDER);
    const picker = new FileInputPicker(page);
    await picker.waitForOpen();
    await picker.uploadFile(IMAGE.path);
    await page.waitForLoadState('networkidle');
    const lib = new AssetLibrary(page);
    await lib.goto(repositoryId);
    await lib.waitForLoad();
    await expect(lib.getRow(IMAGE.name).el).toBeVisible();
  });
});

test.describe('FileInput - library tab', () => {
  test('can select an asset from the library', async ({ page }) => {
    const repositoryId = await toFileMetaInput(page);
    await AssetClient.uploadFile(repositoryId, IMAGE.path);
    const sidebar = new OutlineSidebar(page);
    await sidebar.openFileInput(INPUT_PLACEHOLDER);
    const picker = new FileInputPicker(page);
    await picker.waitForOpen();
    await picker.selectAssetFromLibrary(IMAGE.name);
    await page.waitForLoadState('networkidle');
  });

  test('library tab shows empty state when no assets', async ({ page }) => {
    await toFileMetaInput(page);
    const sidebar = new OutlineSidebar(page);
    await sidebar.openFileInput(INPUT_PLACEHOLDER);
    const picker = new FileInputPicker(page);
    await picker.waitForOpen();
    await picker.switchToLibrary();
    await expect(
      picker.dialog.getByText('No assets found'),
    ).toBeVisible({ timeout: 10000 });
  });
});

test.describe('FileInput - general', () => {
  test('can cancel the picker dialog', async ({ page }) => {
    await toFileMetaInput(page);
    const sidebar = new OutlineSidebar(page);
    await sidebar.openFileInput(INPUT_PLACEHOLDER);
    const picker = new FileInputPicker(page);
    await picker.waitForOpen();
    await picker.cancel();
    await expect(sidebar.getFileInput(INPUT_PLACEHOLDER)).toBeVisible();
  });

  test('picker only shows matching assets for image-only input', async ({
    page,
  }) => {
    const repositoryId = await toFileMetaInput(page);
    await AssetClient.uploadFile(repositoryId, IMAGE.path);
    await AssetClient.uploadFile(repositoryId, DOCUMENT.path);
    const sidebar = new OutlineSidebar(page);
    await sidebar.openFileInput(INPUT_PLACEHOLDER);
    const picker = new FileInputPicker(page);
    await picker.waitForOpen();
    await picker.switchToLibrary();
    await expect(picker.libraryAssetList).toBeVisible({ timeout: 10000 });
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
