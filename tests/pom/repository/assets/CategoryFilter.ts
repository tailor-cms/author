import type { Locator, Page } from '@playwright/test';

export type AssetCategory =
  | 'All'
  | 'Documents'
  | 'Images'
  | 'Links'
  | 'Video'
  | 'Audio'
  | 'Other';

export class CategoryFilter {
  static selector = '.category-filter';

  readonly page: Page;
  readonly el: Locator;

  constructor(page: Page) {
    this.page = page;
    this.el = page.locator(CategoryFilter.selector);
  }

  getButton(category: AssetCategory): Locator {
    return this.el.getByRole('button', { name: category, exact: true });
  }

  async select(category: AssetCategory) {
    await Promise.all([
      this.page.waitForResponse((res) => res.url().includes('/assets')),
      this.getButton(category).click(),
    ]);
  }
}
