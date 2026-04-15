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
    this.nameEl = el.getByTestId('assetRow_name');
    this.typeChip = el.getByTestId('assetRow_type');
    this.menuBtn = el.getByRole('button', { name: 'Actions' });
  }

  async select() {
    await this.checkbox.click();
  }

  async openDetail() {
    await this.el.click();
  }

  get downloadMenuItem(): Locator {
    return this.page.locator('.v-list-item').filter({ hasText: 'Download' });
  }

  get deleteMenuItem(): Locator {
    return this.page.locator('.v-list-item').filter({ hasText: 'Delete' });
  }

  async openMenu() {
    await this.menuBtn.click();
  }

  async download() {
    await this.openMenu();
    await this.downloadMenuItem.click();
  }

  async delete() {
    await this.openMenu();
    await this.deleteMenuItem
      .click();
    const dialog = new ConfirmationDialog(this.page, 'Delete Asset');
    await dialog.confirm();
  }
}
