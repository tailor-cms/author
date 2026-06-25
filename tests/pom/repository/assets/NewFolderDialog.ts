import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

export class NewFolderDialog {
  static selector = 'div[role="dialog"]';

  readonly page: Page;
  readonly el: Locator;
  readonly nameInput: Locator;
  readonly createBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.el = page
      .locator(NewFolderDialog.selector)
      .filter({ hasText: 'New folder' });
    this.nameInput = this.el.getByLabel('Folder name');
    this.createBtn = this.el.getByRole('button', { name: 'Create' });
  }

  async fill(name: string) {
    await this.nameInput.fill(name);
  }

  async create(name: string) {
    await this.fill(name);
    await this.createBtn.click();
    await expect(this.el).not.toBeVisible();
  }
}
