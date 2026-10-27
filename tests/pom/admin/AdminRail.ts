import type { Locator, Page } from '@playwright/test';

export type AdminRailTab =
  | 'Users'
  | 'Groups'
  | 'Structures'
  | 'Elements'
  | 'Emoji';

export class AdminRail {
  readonly page: Page;
  readonly el: Locator;
  readonly tabs: Locator;

  constructor(page: Page) {
    this.page = page;
    this.el = page.locator('.admin-rail');
    this.tabs = this.el.getByRole('tab');
  }

  getTab(name: AdminRailTab) {
    return this.el.getByRole('tab', { name, exact: true });
  }

  goTo(name: AdminRailTab) {
    return this.getTab(name).click();
  }
}
