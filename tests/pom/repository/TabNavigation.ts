import type { Page } from '@playwright/test';

export class TabNavigation {
  readonly page: Page;
  readonly el;

  constructor(page: Page) {
    this.page = page;
    this.el = page.getByTestId('repositoryRoot_nav');
  }

  goToHistory() {
    return this.el.getByText('History').click();
  }

  goToProgress() {
    return this.el.getByText('Progress').click();
  }

  goToSettings() {
    return this.el.getByText('Settings').click();
  }
}
