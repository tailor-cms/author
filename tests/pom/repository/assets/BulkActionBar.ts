import type { Locator, Page } from '@playwright/test';

import { ConfirmationDialog } from '../../common/ConfirmationDialog';

export class BulkActionBar {
  static selector = '.bulk-action-bar';

  readonly page: Page;
  readonly el: Locator;
  readonly selectionChip: Locator;
  readonly indexSelectedBtn: Locator;
  readonly moveSelectedBtn: Locator;
  readonly deleteSelectedBtn: Locator;
  readonly clearBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.el = page.locator(BulkActionBar.selector);
    this.selectionChip = this.el.locator('.selection-count');
    this.clearBtn = this.el.getByRole('button', { name: 'Clear selection' });
    this.indexSelectedBtn = this.el.getByRole('button', {
      name: 'Index',
      exact: true,
    });
    this.moveSelectedBtn = this.el.getByRole('button', {
      name: 'Move',
      exact: true,
    });
    this.deleteSelectedBtn = this.el.getByRole('button', {
      name: 'Delete',
      exact: true,
    });
  }

  async moveSelected() {
    await this.moveSelectedBtn.click();
  }

  async selectAll() {
    await this.el
      .getByRole('button', { name: 'Select all', exact: true })
      .click();
  }

  async deselectAll() {
    await this.el
      .getByRole('button', { name: 'Deselect all', exact: true })
      .click();
  }

  async deleteSelected() {
    await this.deleteSelectedBtn.click();
    const dialog = new ConfirmationDialog(this.page, 'Delete Assets');
    await dialog.confirm();
  }
}
