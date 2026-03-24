import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

export class AddLinkDialog {
  static selector = 'div[role="dialog"]';

  readonly page: Page;
  readonly el: Locator;
  readonly urlInput: Locator;
  readonly addBtn: Locator;
  readonly cancelBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.el = page
      .locator(AddLinkDialog.selector)
      .filter({ hasText: 'Add Link' });
    this.urlInput = this.el.getByLabel('URL');
    this.addBtn = this.el.getByRole('button', { name: 'Add' });
    this.cancelBtn = this.el.getByRole('button', { name: 'Cancel' });
  }

  async fill(url: string) {
    await this.urlInput.fill(url);
  }

  async submit() {
    await this.addBtn.click();
    await expect(this.el).not.toBeVisible();
  }

  async addLink(url: string) {
    await this.fill(url);
    await this.submit();
  }
}
