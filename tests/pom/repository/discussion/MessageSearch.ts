import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

import { ComposerInput, type SuggestionOptions } from './MessageComposer';

export class MessageSearch {
  readonly page: Page;
  readonly bar: Locator;
  readonly el: Locator;
  readonly input: ComposerInput;
  readonly hits: Locator;
  readonly groups: Locator;
  readonly summary: Locator;
  // Swaps the toolbar to the search field
  readonly openBtn: Locator;
  readonly closeBtn: Locator;

  constructor(page: Page) {
    this.bar = page.locator('.search-bar');
    this.el = page.locator('.search-results');
    this.input = new ComposerInput(
      page,
      this.bar.locator('.message-search'),
      'Search messages',
    );
    this.hits = this.el.locator('.result-hit');
    this.groups = this.el.locator('.result-group');
    this.summary = this.bar.locator('.search-summary');
    this.openBtn = page.getByRole('button', {
      name: 'Search messages',
      exact: true,
    });
    this.closeBtn = this.bar.getByRole('button', {
      name: 'Close search',
      exact: true,
    });
    this.page = page;
  }

  async open() {
    if (await this.bar.isVisible()) return;
    await this.openBtn.click();
    await expect(this.bar).toBeVisible();
  }

  async query(text: string) {
    await this.open();
    return this.input.write(text);
  }

  selectSuggestion(trigger: string, options: SuggestionOptions = {}) {
    return this.input.selectSuggestion(trigger, options);
  }

  getHitLocator(text: string) {
    return this.hits.filter({ hasText: text });
  }

  // Opens the thread at the hit
  async openHit(text: string) {
    const hit = this.getHitLocator(text).first();
    await expect(hit).toBeVisible();
    await hit.click();
  }

  getGroupLocator(text: string) {
    return this.groups.filter({ hasText: text });
  }
}
