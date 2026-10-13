import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

export class EmojiPicker {
  readonly el: Locator;
  readonly searchInput: Locator;
  readonly emojis: Locator;

  constructor(page: Page) {
    const el = page.locator('.emoji-picker').last();
    this.searchInput = el.getByPlaceholder('Search emoji');
    this.emojis = el.locator('.emoji-cell');
    this.el = el;
  }

  async pick(query: string) {
    await expect(this.el).toBeVisible();
    await this.searchInput.fill(query);
    await this.emojis.first().click();
  }
}
