import type { Locator, Page } from '@playwright/test';

export class ConfirmationDialog {
  readonly page: Page;
  readonly el: Locator;
  readonly closeBtn: Locator;
  readonly confirmBtn: Locator;

  constructor(page: Page, hasText: string) {
    const el = page.locator('div[role="dialog"]', { hasText });
    this.page = page;
    this.el = el;
    this.closeBtn = el.getByRole('button', { name: 'close' });
    this.confirmBtn = el.getByRole('button', { name: 'confirm' });
  }

  async close() {
    await this.closeBtn.click();
  }

  async confirm() {
    await this.confirmBtn.click();
  }
}
