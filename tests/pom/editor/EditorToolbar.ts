import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

import { Toast } from '../common/Toast';

export class EditorToolbar {
  readonly page: Page;
  readonly el: Locator;
  readonly linkIcon: Locator;
  readonly viewSourceBtn: Locator;
  readonly unlinkBtn: Locator;
  readonly toast: Toast;

  constructor(page: Page) {
    this.page = page;
    this.el = page.locator('.activity-toolbar');
    this.linkIcon = this.el.locator('.link-icon');
    this.viewSourceBtn = this.el.getByRole('button', { name: 'View source' });
    this.unlinkBtn = this.el.getByRole('button', { name: 'Unlink' });
    this.toast = new Toast(page);
  }

  async expectLinkedState() {
    await expect(this.linkIcon).toBeVisible();
    await expect(this.viewSourceBtn).toBeVisible();
    await expect(this.unlinkBtn).toBeVisible();
  }

  async expectDefaultState() {
    await expect(this.linkIcon).not.toBeVisible();
    await expect(this.viewSourceBtn).not.toBeVisible();
    await expect(this.unlinkBtn).not.toBeVisible();
  }

  async viewSource() {
    await this.viewSourceBtn.click();
  }

  async unlink() {
    await this.unlinkBtn.click();
    await this.toast.containsText('unlinked');
  }
}
