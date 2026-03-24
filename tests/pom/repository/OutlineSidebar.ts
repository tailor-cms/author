import type { Locator, Page } from '@playwright/test';

import { Comments } from '../common/Comments';
import { LinkedCopyNotice } from './LinkedCopyNotice';
import { LinkedIndicator } from './LinkedIndicator';
import { Toast } from '../common/Toast';

export class OutlineSidebar {
  readonly page: Page;
  readonly el: Locator;
  readonly nameInput: Locator;
  readonly publishBtn: Locator;
  readonly comments: Comments;
  readonly linkedIndicator: LinkedIndicator;
  readonly linkedCopyNotice: LinkedCopyNotice;
  readonly toast: Toast;

  constructor(page: Page) {
    this.page = page;
    this.toast = new Toast(page);
    this.el = page.locator('.structure-page .v-navigation-drawer');
    this.nameInput = this.el.getByLabel('Name');
    this.publishBtn = this.el.getByRole('button', { name: 'Publish' });
    this.comments = new Comments(page, this.el);
    this.linkedIndicator = new LinkedIndicator(page, this.el);
    this.linkedCopyNotice = new LinkedCopyNotice(page, this.el);
  }

  getFileInput(placeholder: string): Locator {
    return this.el.getByPlaceholder(placeholder);
  }

  async openFileInput(placeholder: string) {
    const input = this.getFileInput(placeholder);
    await expect(input).toBeVisible({ timeout: 5000 });
    await input.click();
  }

  async fillName(name: string) {
    await this.nameInput.fill(name);
    // Blur to trigger the save event
    await this.nameInput.blur();
    await this.toast.isSaved();
  }

  openEditor() {
    return this.el.getByRole('button', { name: 'Open' }).click();
  }

  async publish() {
    await this.publishBtn.click();
    // Select last publish option (Publish element and children)
    const options = await this.el
      .locator('.publish-container .v-list-item-title')
      .all();
    await options[options.length - 1].click();
    // Confirm publish
    const dialog = this.page.locator('div[role="dialog"]');
    await dialog.getByRole('button', { name: 'confirm' }).click();
  }
}
