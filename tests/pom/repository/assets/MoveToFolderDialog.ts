import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

export class MoveToFolderDialog {
  static selector = 'div[role="dialog"]';

  readonly page: Page;
  readonly el: Locator;
  readonly input: Locator;
  readonly moveBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.el = page
      .locator(MoveToFolderDialog.selector)
      .filter({ hasText: 'Move' });
    this.input = this.el.getByRole('combobox', { name: 'Destination folder' });
    this.moveBtn = this.el.getByRole('button', { name: 'Move', exact: true });
  }

  async moveTo(folder: string) {
    await this.input.fill(folder);
    await Promise.all([
      this.page.waitForResponse((res) => res.url().includes('/bulk/move')),
      this.input.press('Enter'),
    ]);
    await expect(this.el).not.toBeVisible();
  }
}
