import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

import { AddLinkDialog } from './assets/AddLinkDialog';
import { AssetSidebar } from './assets/AssetSidebar';
import { AssetRow } from './assets/AssetRow';
import { AssetToolbar } from './assets/AssetToolbar';
import { BulkActionBar } from './assets/BulkActionBar';
import { CategoryFilter, type AssetCategory } from './assets/CategoryFilter';
import { FolderPanel } from './assets/FolderPanel';
import { MoveToFolderDialog } from './assets/MoveToFolderDialog';

export class AssetLibrary {
  readonly page: Page;
  readonly toolbar: AssetToolbar;
  readonly categoryFilter: CategoryFilter;
  readonly addLinkDialog: AddLinkDialog;
  readonly moveDialog: MoveToFolderDialog;
  readonly sidebar: AssetSidebar;
  readonly folders: FolderPanel;
  readonly assetRows: Locator;
  readonly bulkActionBar: BulkActionBar;
  readonly emptyState: Locator;
  readonly pagination: Locator;

  constructor(page: Page) {
    this.page = page;
    this.toolbar = new AssetToolbar(page);
    this.categoryFilter = new CategoryFilter(page);
    this.folders = new FolderPanel(page, this.toolbar);
    this.assetRows = page.locator(AssetRow.selector);
    this.sidebar = new AssetSidebar(page);
    this.bulkActionBar = new BulkActionBar(page);
    this.pagination = page.locator('.v-pagination');
    this.addLinkDialog = new AddLinkDialog(page);
    this.moveDialog = new MoveToFolderDialog(page);
    this.emptyState = page.getByTestId('assetEmptyState');
  }

  async goto(repositoryId: number) {
    await this.page.goto(`/repository/${repositoryId}/root/assets`, {
      waitUntil: 'networkidle',
    });
    await this.waitForLoad();
  }

  async waitForLoad() {
    await expect(
      this.assetRows.or(this.folders.rows).or(this.emptyState).first(),
    ).toBeVisible();
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
    await this.toolbar.openAddLink();
    await expect(this.addLinkDialog.el).toBeVisible();
    await this.addLinkDialog.addLink(url);
    // Wait for the new asset row to appear
    await expect(this.assetRows).toHaveCount(countBefore + 1);
  }

  async filterByCategory(category: AssetCategory) {
    await this.categoryFilter.select(category);
    await this.waitForLoad();
  }

  async setPerPage(size: number) {
    await this.page.getByRole('button', { name: /per page/ }).click();
    await Promise.all([
      this.page.waitForResponse((res) => res.url().includes('/assets')),
      this.page
        .locator('.v-list-item')
        .filter({ hasText: `${size} per page` })
        .click(),
    ]);
  }

  async goToPage(n: number) {
    await Promise.all([
      this.page.waitForResponse((res) => res.url().includes('/assets')),
      this.pagination.getByRole('button', { name: `Go to page ${n}` }).click(),
    ]);
  }
}
