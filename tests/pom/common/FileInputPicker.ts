import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

export class FileInputPicker {
  readonly page: Page;
  readonly dialog: Locator;

  // Tabs
  readonly uploadTab: Locator;
  readonly libraryTab: Locator;
  readonly urlTab: Locator;

  // Upload tab
  readonly uploadFileInput: Locator;

  // Library tab
  readonly librarySearch: Locator;
  readonly libraryAssetList: Locator;
  readonly selectBtn: Locator;

  // URL tab
  readonly urlInput: Locator;
  readonly titleInput: Locator;
  readonly importBtn: Locator;

  // Common
  readonly cancelBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dialog = page.locator('div[role="dialog"]').filter({
      has: page.locator('.v-tab'),
    });

    // Tabs
    this.uploadTab = this.dialog.getByRole('tab', { name: 'Upload' });
    this.libraryTab = this.dialog.getByRole('tab', { name: 'Library' });
    this.urlTab = this.dialog.getByRole('tab', { name: 'URL' });

    // Upload tab
    this.uploadFileInput = this.dialog.getByRole('button', {
      name: 'Browse files',
    });

    // Library tab
    this.librarySearch = this.dialog.getByPlaceholder('Search assets...');
    this.libraryAssetList = this.dialog.locator('.asset-list');
    this.selectBtn = this.dialog.getByRole('button', { name: /^Select/ });

    // URL tab
    this.urlInput = this.dialog.getByLabel('File URL');
    this.titleInput = this.dialog.getByLabel('Title (optional)');
    this.importBtn = this.dialog.getByRole('button', { name: 'Import' });

    // Common
    this.cancelBtn = this.dialog.getByRole('button', { name: 'Cancel' });
  }

  async waitForOpen() {
    await expect(this.dialog).toBeVisible({ timeout: 5000 });
  }

  async waitForClose() {
    await expect(this.dialog).not.toBeVisible({ timeout: 5000 });
  }

  // Tab navigation
  async switchToUpload() {
    await this.uploadTab.click();
  }

  async switchToLibrary() {
    await this.libraryTab.click();
    // Wait for the library content to load
    await this.page.waitForLoadState('networkidle');
  }

  async switchToUrl() {
    await this.urlTab.click();
  }

  // Upload tab actions
  async uploadFile(filePath: string) {
    await this.switchToUpload();
    const [fileChooser] = await Promise.all([
      this.page.waitForEvent('filechooser'),
      this.uploadFileInput.click(),
    ]);
    await fileChooser.setFiles(filePath);
    await this.waitForClose();
  }

  // Library tab actions
  async selectAssetFromLibrary(assetName: string) {
    await this.switchToLibrary();
    // Wait for assets to load
    await expect(this.libraryAssetList).toBeVisible({ timeout: 10000 });
    // Click on the asset item
    const assetItem = this.libraryAssetList
      .locator('.v-list-item')
      .filter({ hasText: assetName });
    await expect(assetItem).toBeVisible();
    await assetItem.click();
    // Click select button
    await this.selectBtn.click();
    await this.waitForClose();
  }

  async searchLibrary(query: string) {
    await this.switchToLibrary();
    await this.librarySearch.fill(query);
    // Debounce wait (300ms) + load
    await this.page.waitForTimeout(500);
    await this.page.waitForLoadState('networkidle');
  }

  getLibraryAssetItem(name: string): Locator {
    return this.libraryAssetList
      .locator('.v-list-item')
      .filter({ hasText: name });
  }

  // URL tab actions
  async importUrl(url: string, title?: string) {
    await this.switchToUrl();
    await this.urlInput.fill(url);
    if (title) await this.titleInput.fill(title);
    await this.importBtn.click();
    await this.waitForClose();
  }

  async cancel() {
    await this.cancelBtn.click();
    await this.waitForClose();
  }
}
