import type { Locator, Page } from '@playwright/test';

export class ContentElement {
  static selector = '.content-element';
  readonly page: Page;
  readonly el: Locator;
  readonly deleteBtn: Locator;

  constructor(page: Page, el: Locator) {
    this.page = page;
    this.el = el;
    this.deleteBtn = el.getByRole('button', { name: 'Delete element' });
  }

  async focus() {
    await this.el.click();
  }

  async remove() {
    await this.el.hover();
    await this.deleteBtn.click();
    const dialog = this.page.locator('div[role="dialog"]');
    await dialog.getByRole('button', { name: 'confirm' }).click();
  }
}
