import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

export class AssetDetailDialog {
  static selector = '.v-dialog .v-card';

  readonly page: Page;
  readonly el: Locator;
  readonly closeBtn: Locator;
  readonly descriptionInput: Locator;
  readonly tagsInput: Locator;
  readonly saveBtn: Locator;
  readonly deleteBtn: Locator;
  readonly downloadBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.el = page.locator(AssetDetailDialog.selector).filter({
      has: page.locator('.detail-body'),
    });
    this.closeBtn = this.el
      .locator('.v-toolbar')
      .getByLabel('Close');
    this.descriptionInput = this.el.getByLabel('Description');
    this.tagsInput = this.el.getByLabel('Tags');
    this.saveBtn = this.el.getByRole('button', { name: 'Save' });
    this.deleteBtn = this.el.getByRole('button', { name: 'Delete' });
    this.downloadBtn = this.el.getByRole('button', { name: 'Download' });
  }

  async waitForOpen() {
    await expect(this.el).toBeVisible({ timeout: 5000 });
  }

  async close() {
    await this.closeBtn.click();
    await expect(this.el).not.toBeVisible();
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
    await this.saveBtn.click();
    await this.page.waitForLoadState('networkidle');
  }
}
