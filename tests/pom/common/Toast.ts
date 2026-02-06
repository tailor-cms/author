import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

export class Toast {
  readonly page: Page;
  readonly el;

  constructor(page: Page) {
    this.page = page;
    this.el = page.locator('.v-snackbar');
  }

  hasText(text: string | RegExp) {
    return expect(this.el).toHaveText(text);
  }

  containsText(text: string | RegExp) {
    return expect(this.el).toContainText(text);
  }

  isSaved() {
    return expect(this.el).toContainText(/saved/i);
  }

  waitForDismiss() {
    return expect(this.el).not.toBeVisible();
  }
}
