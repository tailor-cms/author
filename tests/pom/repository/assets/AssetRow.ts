import type { Locator, Page } from '@playwright/test';

import { ConfirmationDialog } from '../../common/ConfirmationDialog';

export class AssetRow {
  static selector = '.asset-row';

  readonly page: Page;
  readonly el: Locator;
  readonly checkbox: Locator;
  readonly nameEl: Locator;
  readonly typeChip: Locator;
  readonly menuBtn: Locator;

  constructor(page: Page, el: Locator) {
    this.page = page;
    this.el = el;
    this.checkbox = el.locator('.v-checkbox-btn');
    this.nameEl = el.locator('.text-truncate').first();
    this.typeChip = el.locator('.text-capitalize').first();
    this.menuBtn = el.getByRole('button', { name: 'Actions' });
  }

  async select() {
    await this.checkbox.click();
  }

  async openDetail() {
    await this.el.click();
  }

  async openMenu() {
    await this.menuBtn.click();
  }

  async download() {
    await this.openMenu();
    await this.page
      .locator('.v-list-item')
      .filter({ hasText: 'Download' })
      .click();
  }

  async delete() {
    await this.openMenu();
    await this.page
      .locator('.v-list-item')
      .filter({ hasText: 'Delete' })
      .click();
    const dialog = new ConfirmationDialog(this.page, 'Delete Asset');
    await dialog.confirm();
  }
}
