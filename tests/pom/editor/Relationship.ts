import type { Locator, Page } from '@playwright/test';
import { ConfirmationDialog } from '../common/ConfirmationDialog';

export class Relationship {
  readonly el: Locator;
  readonly name: string;
  readonly addBtn: Locator;
  readonly removeBtn: Locator;
  readonly overview: Locator;
  readonly confirmationDialog: ConfirmationDialog;

  constructor(page: Page, name: string) {
    const el = page.locator('.element-relationship', { hasText: name });
    this.addBtn = el.getByRole('button', { name: 'Add Relationship' });
    this.removeBtn = el.getByRole('button', { name: 'Remove Relationship' });
    this.confirmationDialog = new ConfirmationDialog(page, 'Remove Related Contents');
    this.overview = el.locator('.v-list-item-subtitle');
    this.el = el;
  }

  async add() {
    await this.addBtn.click();
  }

  async clear() {
    await this.removeBtn.click();
    await this.confirmationDialog.confirm();
  }
}
