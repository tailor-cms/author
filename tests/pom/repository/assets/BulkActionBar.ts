import type { Locator, Page } from '@playwright/test';

import { ConfirmationDialog } from '../../common/ConfirmationDialog';

export class BulkActionBar {
  static selector = '.bulk-action-bar';

  readonly page: Page;
  readonly el: Locator;
  readonly selectionChip: Locator;
  readonly deselectAllBtn: Locator;
  readonly indexSelectedBtn: Locator;
  readonly deleteSelectedBtn: Locator;
  readonly cancelBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.el = page.locator(BulkActionBar.selector);
    this.selectionChip = this.el.locator('.selection-count');
    this.cancelBtn = this.el.getByRole('button', { name: 'Cancel' });
    this.deselectAllBtn = this.el.getByRole('button', {
      name: 'Deselect all',
    });
    this.indexSelectedBtn = this.el.getByRole('button', {
      name: 'Index selected',
    });
    this.deleteSelectedBtn = this.el.getByRole('button', {
      name: 'Delete selected',
    });
  }

  async selectAll() {
    await this.page
      .getByRole('button', { name: 'Select all', exact: true })
      .click();
  }

  async deselectAll() {
    await this.deselectAllBtn.click();
  }

  async deleteSelected() {
    await this.deleteSelectedBtn.click();
    const dialog = new ConfirmationDialog(this.page, 'Delete Assets');
    await dialog.confirm();
  }
}
