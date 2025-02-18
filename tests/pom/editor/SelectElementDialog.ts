import type { Locator, Page } from '@playwright/test';

export class SelectElementDialog {
  readonly page: Page;
  readonly el: Locator;
  readonly confirmBtn: Locator;

  constructor(page: Page) {
    const el = page.locator('div[role="dialog"]', { hasText: /^(Copy|Select) elements/ });
    this.confirmBtn = el.getByRole('button', { name: /^(Copy|Save)/ });
    this.el = el;
  }

  async confirm() {
    await this.confirmBtn.click();
  }

  async selectActivity(title: string) {
    await this.el.getByText(title).click();
  }

  async selectElement(hasText: string) {
    const element = await this.el.locator(`.content-preview`, { hasText });
    await element.getByRole('checkbox').check();
  }
}
