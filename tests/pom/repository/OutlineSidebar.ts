import { expect, Locator, Page } from '@playwright/test';

export class OutlineSidebar {
  readonly page: Page;
  readonly el: Locator;
  readonly nameInput: Locator;

  constructor(page: Page) {
    this.page = page;
    this.el = page.locator('.structure-page .v-navigation-drawer');
    this.nameInput = this.el.getByLabel('Name');
  }

  async fillName(name) {
    await this.nameInput.fill(name);
    // Blur to trigger the save event
    await this.nameInput.blur();
    await expect(this.page.locator('.v-snackbar')).toHaveText('saved');
  }
}
