import type { Locator, Page } from '@playwright/test';

export class LinkedCopyNotice {
  readonly page: Page;
  readonly el: Locator;
  readonly viewOnSourceBtn: Locator;

  constructor(page: Page, parent: Locator) {
    this.page = page;
    this.el = parent.locator('.v-card', { hasText: 'Comments disabled' });
    this.viewOnSourceBtn = this.el.getByRole('button', {
      name: 'View on source',
    });
  }

  async navigateToSource() {
    await this.viewOnSourceBtn.click();
  }
}
