import { type Locator, type Page, expect } from '@playwright/test';

import { Comments } from '../common/Comments';
import { FileInput } from '../common/FileInput';
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
    // Select last publish option (publish element and children)
    const options = this.el.getByTestId('publishMenu').locator('.v-list-item');
    await options.last().click();
    // Confirm publish
    const dialog = this.page.locator('div[role="dialog"]');
    await dialog.getByRole('button', { name: 'confirm' }).click();
  }

  getMetaInput(placeholder: string): Locator {
    return this.el.getByPlaceholder(placeholder);
  }

  async openFileMeta(placeholder: string) {
    const input = this.getMetaInput(placeholder);
    await expect(input).toBeVisible();
    await input.click();
    const fileInput = new FileInput(this.page, this.el);
    await fileInput.picker.waitForOpen();
    return fileInput;
  }
}
