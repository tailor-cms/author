import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

import { AddLinkDialog } from './assets/AddLinkDialog';
import { AssetDetailDialog } from './assets/AssetDetailDialog';
import { AssetRow } from './assets/AssetRow';
import { AssetToolbar } from './assets/AssetToolbar';
import { BulkActionBar } from './assets/BulkActionBar';
import { CategoryFilter, type AssetCategory } from './assets/CategoryFilter';

export class AssetLibrary {
  readonly page: Page;
  readonly toolbar: AssetToolbar;
  readonly categoryFilter: CategoryFilter;
  readonly addLinkDialog: AddLinkDialog;
  readonly detailDialog: AssetDetailDialog;
  readonly assetRows: Locator;
  readonly bulkActionBar: BulkActionBar;
  readonly emptyState: Locator;

  constructor(page: Page) {
    this.page = page;
    this.toolbar = new AssetToolbar(page);
    this.categoryFilter = new CategoryFilter(page);
    this.addLinkDialog = new AddLinkDialog(page);
    this.assetRows = page.locator(AssetRow.selector);
    this.detailDialog = new AssetDetailDialog(page);
    this.bulkActionBar = new BulkActionBar(page);
    this.emptyState = page.locator('.empty-state');
  }

  async goto(repositoryId: number) {
    await this.page.goto(`/repository/${repositoryId}/root/assets`, {
      waitUntil: 'networkidle',
    });
    await this.waitForLoad();
  }

  async waitForLoad() {
    await expect(this.assetRows.first().or(this.emptyState)).toBeVisible();
  }

  getRow(name: string): AssetRow {
    const el = this.assetRows.filter({ hasText: name });
    return new AssetRow(this.page, el);
  }

  async getRows(): Promise<AssetRow[]> {
    const items = await this.assetRows.all();
    return items.map((el) => new AssetRow(this.page, el));
  }

  async getRowCount(): Promise<number> {
    return this.assetRows.count();
  }

  async expectRowCount(count: number) {
    await expect(this.assetRows).toHaveCount(count);
  }

  async uploadFiles(filePaths: string[]) {
    await this.toolbar.uploadFiles(filePaths);
    await this.waitForLoad();
  }

  async uploadAndVerify(
    filePath: string,
    expectedName: string,
    expectedType: string,
  ) {
    await this.uploadFiles([filePath]);
    const row = this.getRow(expectedName);
    await expect(row.el).toBeVisible();
    await expect(row.typeChip).toContainText(expectedType);
    // Verify persistence
    await this.page.reload({ waitUntil: 'networkidle' });
    await this.waitForLoad();
    await expect(row.el).toBeVisible();
  }

  async addLink(url: string) {
    await this.waitForLoad();
    const countBefore = await this.getRowCount();
    await this.toolbar.addLinkBtn.click();
    await expect(this.addLinkDialog.el).toBeVisible();
    await this.addLinkDialog.addLink(url);
    // Wait for the new asset row to appear
    await expect(this.assetRows).toHaveCount(countBefore + 1);
  }

  async filterByCategory(category: AssetCategory) {
    await this.categoryFilter.select(category);
    await this.waitForLoad();
  }
}
