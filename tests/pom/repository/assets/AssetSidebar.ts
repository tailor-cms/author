import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

import { ConfirmationDialog } from '../../common/ConfirmationDialog';

export class AssetSidebar {
  static selector = '.asset-sidebar';

  readonly page: Page;
  readonly el: Locator;
  readonly header: Locator;
  readonly closeBtn: Locator;
  readonly actionsBtn: Locator;
  readonly descriptionInput: Locator;
  readonly tagsInput: Locator;
  readonly usages: Locator;
  readonly usageRows: Locator;

  constructor(page: Page) {
    this.page = page;
    this.el = page.locator(AssetSidebar.selector);
    this.header = this.el.locator('.header');
    this.closeBtn = this.header.getByRole('button', { name: 'Close' });
    this.actionsBtn = this.header.getByRole('button', { name: 'Actions' });
    this.descriptionInput = this.el.getByLabel('Description');
    this.tagsInput = this.el.getByLabel('Tags');
    this.usages = this.el.getByTestId('assetUsages');
    this.usageRows = this.usages.getByTestId('assetUsage');
  }

  get deleteMenuItem(): Locator {
    return this.page.locator('.v-list-item').filter({ hasText: 'Delete' });
  }

  get downloadMenuItem(): Locator {
    return this.page.locator('.v-list-item').filter({ hasText: 'Download' });
  }

  async waitForOpen() {
    await expect(this.el).toBeInViewport({ timeout: 5000 });
  }

  async close() {
    await this.closeBtn.click();
    await expect(this.el).not.toBeInViewport();
  }

  async openMenu() {
    await this.actionsBtn.click();
  }

  async editDescription(text: string) {
    await this.descriptionInput.clear();
    await this.descriptionInput.fill(text);
  }

  async addTag(tag: string) {
    await this.tagsInput.click();
    await this.tagsInput.fill(tag);
    await this.tagsInput.press('Enter');
    await this.page.waitForTimeout(200);
  }

  async save() {
    await this.close();
    await this.page.waitForLoadState('networkidle');
  }

  async delete() {
    await this.openMenu();
    await this.deleteMenuItem.click();
    const dialog = new ConfirmationDialog(this.page, 'Delete Asset');
    await dialog.confirm();
  }
}
