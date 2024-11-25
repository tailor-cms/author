import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

import { ContentElement } from './ContentElement';

const ELEMENT_SELECTOR = '.content-element';

export class Container {
  static selector = '.content-container';
  readonly page: Page;
  readonly el: Locator;
  readonly deleteBtn: Locator;

  constructor(page: Page, el: Locator) {
    this.page = page;
    this.el = el;
    this.deleteBtn = el.getByRole('button', { name: 'Delete section' });
  }

  async getElements(content?: string) {
    const locator = this.el.locator(ELEMENT_SELECTOR);
    const items = await (content
      ? locator.filter({ hasText: content }).all()
      : locator.all());
    return items.map((item) => new ContentElement(this.page, item));
  }

  async deleteElements() {
    // Need to fetch one by one since locator will be stale after list is updated
    const elementCount = await this.el.locator(ELEMENT_SELECTOR).count();
    for (let i = 0; i < elementCount; i++) {
      const locator = this.el.locator(ELEMENT_SELECTOR).first();
      const element = new ContentElement(this.page, locator);
      await element.remove();
    }
  }

  async remove() {
    await this.deleteBtn.click();
    const dialog = this.page.locator('div[role="dialog"]');
    await dialog.getByRole('button', { name: 'confirm' }).click();
    await expect(this.el).not.toBeVisible();
  }
}
