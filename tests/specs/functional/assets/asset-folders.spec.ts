import { DOCUMENT, IMAGE } from '../../../fixtures/assets';
import { expect, test } from '@playwright/test';
import { toAssetLibrary, toSeededAssetLibrary } from './helpers';
import AssetClient from '../../../api/AssetClient';
import SeedClient from '../../../api/SeedClient';

const seedImageInPhotos = (id: number) =>
  AssetClient.uploadFile(id, IMAGE.path, { folder: 'photos' });

// One asset nested in `photos`, one at the root.
const seedNestedAndRoot = async (id: number) => {
  await AssetClient.uploadFile(id, IMAGE.path, { folder: 'photos' });
  await AssetClient.uploadFile(id, DOCUMENT.path);
};

// An image and a document, both loose at the root.
const seedTwoAtRoot = async (id: number) => {
  await AssetClient.uploadFile(id, IMAGE.path);
  await AssetClient.uploadFile(id, DOCUMENT.path);
};

test.describe('Asset folders', () => {
  test('can create an empty folder that persists locally', async ({ page }) => {
    const { lib } = await toAssetLibrary(page);
    await expect(lib.emptyLibrary).toBeVisible();
    expect(await lib.folders.count()).toBe(0);
    await lib.folders.createFirst('Diagrams');
    await expect(lib.folders.breadcrumbs).toContainText('Diagrams');
    await expect(lib.emptyState).toContainText(
      'saved on your device until you add a file',
    );
    // "Go back" in the empty state returns to the parent (root).
    await lib.emptyState.getByRole('button', { name: 'Go back' }).click();
    await expect(lib.folders.row('Diagrams')).toBeVisible();
    // A local (empty) folder offers "Remove folder" in its menu.
    await lib.folders.openMenu('Diagrams');
    await expect(lib.folders.removeAction).toBeVisible();
    await page.keyboard.press('Escape');
    // Empty folders live in localStorage, so they survive a reload.
    await page.reload({ waitUntil: 'networkidle' });
    // Breadcrumbs are hidden at the root; the persisted folder row is the tell.
    await expect(lib.folders.breadcrumbs).toBeHidden();
    await expect(lib.folders.row('Diagrams')).toBeVisible();
    await lib.folders.remove('Diagrams');
    await expect(lib.folders.rows).toHaveCount(0);
  });

  test('validates the new folder name', async ({ page }) => {
    const { lib } = await toAssetLibrary(page);
    await lib.folders.createFirst('Diagrams');
    await lib.folders.navigateToCrumb('Home');
    const dialog = lib.folders.dialog;
    // Duplicate name is rejected and the dialog stays open.
    await lib.toolbar.openNewFolder();
    await dialog.fill('Diagrams');
    await dialog.createBtn.click();
    await expect(dialog.el).toContainText('already exists');
    await expect(dialog.el).toBeVisible();
    // A slash in a single folder name is rejected too.
    await dialog.fill('a/b');
    await dialog.createBtn.click();
    await expect(dialog.el).toContainText('cannot contain a slash');
    // "." / ".." are rejected as invalid names.
    await dialog.fill('..');
    await dialog.createBtn.click();
    await expect(dialog.el).toContainText('valid folder name');
  });

  test('can upload directly into a folder', async ({ page }) => {
    const { lib } = await toAssetLibrary(page);
    await lib.folders.createFirst('Photos');
    await lib.uploadFiles([IMAGE.path]);
    await expect(lib.getRow(IMAGE.name).el).toBeVisible();
    await lib.folders.navigateToCrumb('Home');
    await expect(lib.folders.row('Photos')).toBeVisible();
    // Now server-backed (has an asset): the menu offers "Delete folder", not
    // the local-only "Remove folder".
    await lib.folders.openMenu('Photos');
    await expect(lib.folders.deleteAction).toBeVisible();
    await expect(lib.folders.removeAction).toHaveCount(0);
    await page.keyboard.press('Escape');
    await expect(lib.assetRows).toHaveCount(0);
    // Persists across reload.
    await page.reload({ waitUntil: 'networkidle' });
    await expect(lib.folders.breadcrumbs).toBeHidden();
    await lib.folders.open('Photos');
    await expect(lib.getRow(IMAGE.name).el).toBeVisible();
  });

  test('can move an asset into a folder via the row menu', async ({ page }) => {
    const { lib } = await toSeededAssetLibrary(page, seedTwoAtRoot);
    await expect(lib.assetRows).toHaveCount(2);
    await lib.getRow(IMAGE.name).openMoveDialog();
    await lib.moveDialog.moveTo('Archive');
    // The image leaves the root listing and lands in the new folder.
    await expect(lib.assetRows).toHaveCount(1);
    await expect(lib.folders.row('Archive')).toBeVisible();
    await lib.folders.open('Archive');
    await expect(lib.getRow(IMAGE.name).el).toBeVisible();
  });

  test('can bulk move selected assets into a folder', async ({ page }) => {
    const { lib } = await toSeededAssetLibrary(page, seedTwoAtRoot);
    await expect(lib.assetRows).toHaveCount(2);
    await lib.getRow(IMAGE.name).select();
    await lib.bulkActionBar.selectAll();
    await lib.bulkActionBar.moveSelected();
    await lib.moveDialog.moveTo('Batch');
    await expect(lib.assetRows).toHaveCount(0);
    await expect(lib.folders.row('Batch')).toBeVisible();
    await lib.folders.open('Batch');
    await expect(lib.assetRows).toHaveCount(2);
  });

  test('shows the folder bar and existing folders on load', async ({ page }) => {
    const { lib } = await toSeededAssetLibrary(page, seedImageInPhotos);
    // At the root the breadcrumb trail is hidden; the folder rows still show.
    await expect(lib.folders.breadcrumbs).toBeHidden();
    await expect(lib.folders.row('photos')).toBeVisible();
  });

  test('searching spans all folders and hides folder rows', async ({ page }) => {
    // One asset nested in a folder, one at the root.
    const { lib } = await toSeededAssetLibrary(page, seedNestedAndRoot);
    await expect(lib.folders.row('photos')).toBeVisible();
    await expect(lib.getRow(IMAGE.name).el).toBeHidden();
    // Searching for the nested asset finds it across folders, and folder rows
    // drop out (results are a flat, files-only listing).
    await lib.toolbar.searchInput.fill(IMAGE.name);
    await expect(lib.getRow(IMAGE.name).el).toBeVisible();
    await expect(lib.folders.rows).toHaveCount(0);
    // Clearing the search returns to browsing the root folder.
    await lib.toolbar.searchInput.fill('');
    await expect(lib.folders.row('photos')).toBeVisible();
    await expect(lib.getRow(IMAGE.name).el).toBeHidden();
  });

  test('can delete a folder and all its files', async ({ page }) => {
    // One asset nested in a folder, one loose at the root.
    const { lib, repositoryId } = await toSeededAssetLibrary(page, seedNestedAndRoot);
    await expect(lib.folders.row('photos')).toBeVisible();
    await expect(lib.getRow(DOCUMENT.name).el).toBeVisible();
    await lib.folders.delete('photos');
    // The folder and the image inside it are gone; the root document remains.
    await expect(lib.folders.row('photos')).toHaveCount(0);
    await expect(lib.getRow(DOCUMENT.name).el).toBeVisible();
    // Server-side: only the root document survives.
    const remaining = await AssetClient.list(repositoryId);
    expect(remaining.data.items.length).toBe(1);
  });

  test('filtering by type spans all folders and hides folder rows', async ({
    page,
  }) => {
    const { lib } = await toSeededAssetLibrary(page, seedNestedAndRoot);
    await expect(lib.folders.row('photos')).toBeVisible();
    await expect(lib.getRow(DOCUMENT.name).el).toBeVisible();
    await expect(lib.getRow(IMAGE.name).el).toBeHidden();
    // Filtering to Images goes global: the nested image shows, while the
    // document and the folder rows drop out.
    await lib.filterByCategory('Images');
    await expect(lib.getRow(IMAGE.name).el).toBeVisible();
    await expect(lib.getRow(DOCUMENT.name).el).toBeHidden();
    await expect(lib.folders.rows).toHaveCount(0);
  });

  test('search results show each asset folder and the chip navigates to it',
    async ({ page }) => {
      const { lib } = await toSeededAssetLibrary(page, seedImageInPhotos);
      await lib.toolbar.searchInput.fill(IMAGE.name);
      const row = lib.getRow(IMAGE.name);
      await expect(row.el).toBeVisible();
      // The result is tagged with the folder it lives in.
      const folderChip = row.folderChip;
      await expect(folderChip).toContainText('photos');
      // Clicking the chip clears the search and browses into that folder.
      await folderChip.click();
      await expect(lib.toolbar.searchInput).toHaveValue('');
      await expect(lib.folders.breadcrumbs).toContainText('photos');
      await expect(lib.getRow(IMAGE.name).el).toBeVisible();
    });

  test('supports nested folders and breadcrumb navigation', async ({ page }) => {
    const { lib } = await toAssetLibrary(page);
    // Create a nested folder by creating one inside another.
    await lib.folders.createFirst('Parent');
    await expect(lib.folders.breadcrumbs).toContainText('Parent');
    await lib.folders.create('Child');
    await expect(lib.folders.breadcrumbs).toContainText('Child');
    // Upload into the nested folder.
    await lib.uploadFiles([IMAGE.path]);
    await expect(lib.getRow(IMAGE.name).el).toBeVisible();
    // Breadcrumb up to Parent: it shows the Child subfolder, no loose files.
    await lib.folders.navigateToCrumb('Parent');
    await expect(lib.folders.row('Child')).toBeVisible();
    await expect(lib.assetRows).toHaveCount(0);
    // Up one level via the breadcrumb up-arrow: back at the root, Parent is now
    // a server-backed folder holding Child.
    await lib.folders.navigateUp();
    await expect(lib.folders.row('Parent')).toBeVisible();
    await lib.folders.open('Parent');
    await expect(lib.folders.row('Child')).toBeVisible();
  });

  test('can move an asset back to the library root', async ({ page }) => {
    const { lib } = await toSeededAssetLibrary(page, seedImageInPhotos);
    await lib.folders.open('photos');
    await expect(lib.getRow(IMAGE.name).el).toBeVisible();
    // Move it out to the root (empty destination).
    await lib.getRow(IMAGE.name).openMoveDialog();
    await lib.moveDialog.moveTo('');
    // "photos" is now empty -> gone; the asset sits at the root.
    await lib.folders.navigateToCrumb('Home');
    await expect(lib.folders.row('photos')).toHaveCount(0);
    await expect(lib.getRow(IMAGE.name).el).toBeVisible();
  });

  test('navigating clears an active type filter', async ({ page }) => {
    const { lib } = await toSeededAssetLibrary(page, seedImageInPhotos);
    // Drill into the folder, then filter to Images (goes global; folder rows
    // drop out but the breadcrumb stays).
    await lib.folders.open('photos');
    await lib.filterByCategory('Images');
    await expect(lib.folders.rows).toHaveCount(0);
    // Clicking the Home breadcrumb resets the filter and returns to browsing
    await lib.folders.navigateToCrumb('Home');
    await expect(lib.folders.row('photos')).toBeVisible();
  });

  test('files paginate while folder rows stay above every page', async ({
    page,
  }) => {
    // 11 loose files at the root, plus a file tucked in a folder.
    const { lib } = await toSeededAssetLibrary(page, async (id) => {
      for (let i = 1; i <= 11; i++) {
        await AssetClient.uploadFile(id, DOCUMENT.path, { name: `doc-${i}.pdf` });
      }
      await AssetClient.uploadFile(id, IMAGE.path, { folder: 'photos' });
    });
    // Root: the "photos" folder + 11 files. Folders aren't counted, and 11
    // files fit the default 25/page, so there's no paginator yet.
    await expect(lib.folders.row('photos')).toBeVisible();
    await expect(lib.assetRows).toHaveCount(11);
    await expect(lib.pagination).toBeHidden();
    // Drop the page size to 10 -> two pages of files.
    await lib.setPerPage(10);
    await expect(lib.assetRows).toHaveCount(10);
    await expect(lib.pagination).toBeVisible();
    // Folders are a separate, unpaginated section - still shown.
    await expect(lib.folders.row('photos')).toBeVisible();
    // Page 2 holds the 11th file, with the folder still above it.
    await lib.goToPage(2);
    await expect(lib.assetRows).toHaveCount(1);
    await expect(lib.folders.row('photos')).toBeVisible();
  });
});

test.afterAll(async () => {
  await SeedClient.resetDatabase();
});
