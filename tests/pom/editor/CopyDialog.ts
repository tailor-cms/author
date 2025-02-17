import type { Locator, Page } from '@playwright/test';

export class CopyDialog {
  readonly page: Page;
  readonly el: Locator;
  readonly copyBtn: Locator;

  constructor(page: Page) {
    const el = page.locator('div[role="dialog"]', { hasText: 'Copy elements' });
    this.copyBtn = el.getByRole('button', { name: 'Copy' });
    this.el = el;
  }

  copyElement() {
    return this.copyBtn.click();
  }

  async selectActivity(title: string) {
    await this.el.getByText(title).click();
  }

  async selectElement(hasText: string) {
    const element = await this.el.locator(`.content-preview`, { hasText });
    await element.getByRole('checkbox').check();
  }
}
