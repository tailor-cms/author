import type { Locator, Page } from '@playwright/test';

export class SelectElementDialog {
  readonly page: Page;
  readonly el: Locator;
  readonly confirmBtn: Locator;
  readonly selectAllBtn: Locator;

  constructor(page: Page) {
    const el = page.locator('div[role="dialog"]', { hasText: /^(Copy|Select) elements/ });
    this.confirmBtn = el.getByRole('button', { name: /^(Copy|Save)/ });
    this.selectAllBtn = el.getByRole('button', { name: 'Select all' });
    this.el = el;
  }

  async confirm() {
    await this.confirmBtn.click();
  }

  async selectActivity(title: string) {
    await this.el.getByText(title).click();
  }

  async selectAll() {
    await this.selectAllBtn.click();
  }

  async selectElement(hasText: string) {
    const element = await this.el.locator(`.content-preview`, { hasText });
    await element.getByRole('checkbox').check();
  }

  async select(page: string, element?: string) {
    await this.selectActivity(page);
    if (element) await this.selectElement(element);
    else await this.selectAll();
    await this.confirm();
  }
}
