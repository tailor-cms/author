import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

import { Toast } from '../common/Toast';

export class LinkedIndicator {
  readonly page: Page;
  readonly el: Locator;
  readonly menuBtn: Locator;

  readonly toast: Toast;

  constructor(page: Page, parent: Locator) {
    this.page = page;
    this.toast = new Toast(page);
    this.el = parent.locator('.linked-indicator');
    this.menuBtn = this.el.getByRole('button', { name: 'Linked actions' });
  }

  async expectVisible() {
    await expect(this.el).toBeVisible();
  }

  async expectNotVisible() {
    await expect(this.el).not.toBeVisible();
  }

  async expectLinkedStatus() {
    const status = this.el.locator('.linked-status');
    await expect(status).toContainText(/linked/i);
  }

  async openMenu() {
    await this.menuBtn.click();
  }

  async viewSource() {
    await this.openMenu();
    await this.page
      .locator('.v-list-item')
      .filter({ hasText: 'View source' })
      .click();
  }

  async unlink() {
    await this.openMenu();
    await this.page
      .locator('.v-list-item')
      .filter({ hasText: 'Unlink' })
      .click();
    await this.toast.containsText('unlinked');
    await this.expectNotVisible();
  }

  async goToLinkedParent() {
    await this.openMenu();
    await this.page
      .locator('.v-list-item')
      .filter({ hasText: 'Go to linked parent' })
      .click();
  }
}
