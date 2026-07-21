import { type Locator, type Page, expect } from '@playwright/test';

import { Comments } from '../common/Comments';
import { confirmAction } from '../common/utils';
import { FileInput } from '../common/FileInput';
import { LinkedCopyNotice } from './LinkedCopyNotice';
import { LinkedIndicator } from './LinkedIndicator';
import { Toast } from '../common/Toast';

export class OutlineSidebar {
  readonly page: Page;
  readonly el: Locator;
  readonly nameInput: Locator;
  readonly publishBtn: Locator;
  readonly publishStatus: Locator;
  readonly publishBadge: Locator;
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
    this.publishStatus = this.el.locator('.publish-status');
    this.publishBadge = this.publishStatus.locator('.v-icon');
    this.comments = new Comments(page, this.el);
    this.linkedIndicator = new LinkedIndicator(page, this.el);
    this.linkedCopyNotice = new LinkedCopyNotice(page, this.el);
  }

  async expectName(name: string) {
    await expect(this.nameInput).toHaveValue(name);
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
    // Wait for the success notification so the publish request has settled.
    await this.toast.hasText(/published/i);
  }

  expectNotPublished() {
    return expect(this.publishStatus).toContainText('Not published');
  }

  expectPublished() {
    return expect(this.publishStatus).toContainText(/Published on/);
  }

  // Green badge - activity and its subtree are fully published.
  expectFullyPublished() {
    return expect(this.publishBadge).toHaveClass(/text-success/);
  }

  async remove() {
    await this.el.getByLabel('Options menu').click();
    await this.page.locator('.activity-menu').getByLabel('Remove').click();
    const message = this.page.getByText('Are you sure you want to delete');
    await expect(message).toBeVisible();
    await confirmAction(this.page);
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
