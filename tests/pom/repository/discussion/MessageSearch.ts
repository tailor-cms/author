import type { Locator, Page } from '@playwright/test';

import { ComposerInput, type SuggestionOptions } from './MessageComposer';

export class MessageSearch {
  readonly page: Page;
  readonly bar: Locator;
  readonly el: Locator;
  readonly input: ComposerInput;
  readonly hits: Locator;
  readonly groups: Locator;
  readonly summary: Locator;
  readonly clearBtn: Locator;

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
    this.clearBtn = this.bar.getByRole('button', {
      name: 'Clear search',
      exact: true,
    });
    this.page = page;
  }

  query(text: string) {
    return this.input.write(text);
  }

  selectSuggestion(trigger: string, options: SuggestionOptions = {}) {
    return this.input.selectSuggestion(trigger, options);
  }

  getHitLocator(text: string) {
    return this.hits.filter({ hasText: text });
  }

  getGroupLocator(text: string) {
    return this.groups.filter({ hasText: text });
  }
}
