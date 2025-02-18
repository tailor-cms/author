import type { Locator, Page } from '@playwright/test';
import { ConfirmationDialog } from '../common/ConfirmationDialog';
import { SelectElementDialog } from './SelectElementDialog';

export class Relationship {
  readonly el: Locator;
  readonly name: string;
  readonly addBtn: Locator;
  readonly removeBtn: Locator;
  readonly overview: Locator;
  readonly confirmationDialog: ConfirmationDialog;
  readonly relationshipDialog: SelectElementDialog;

  constructor(page: Page, name: string) {
    const el = page.locator('.element-relationship', { hasText: name });
    this.addBtn = el.getByRole('button', { name: 'Add Relationship' });
    this.removeBtn = el.getByRole('button', { name: 'Remove Relationship' });
    this.confirmationDialog = new ConfirmationDialog(page, 'Remove Related Contents');
    this.relationshipDialog = new SelectElementDialog(page);
    this.overview = el.locator('.v-list-item-subtitle');
    this.el = el;
  }

  async openDialog() {
    await this.addBtn.click();
  }

  async add(title: string, content?: string) {
    await this.openDialog();
    await this.relationshipDialog.select(title, content);
  }

  async clear() {
    await this.removeBtn.click();
    await this.confirmationDialog.confirm();
  }
}
