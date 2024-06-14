import { expect, Locator, Page } from '@playwright/test';

export class OutlineSidebar {
  readonly page: Page;
  readonly el: Locator;
  readonly nameInput: Locator;
  readonly publishBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.el = page.locator('.structure-page .v-navigation-drawer');
    this.nameInput = this.el.getByLabel('Name');
    this.publishBtn = this.el.getByRole('button', { name: 'Publish' });
  }

  async fillName(name) {
    await this.nameInput.fill(name);
    // Blur to trigger the save event
    await this.nameInput.blur();
    await expect(this.page.locator('.v-snackbar')).toHaveText(/saved/);
  }

  async publish() {
    await this.publishBtn.click();
    // Select last publish option (Publish element and children)
    const options = await this.el
      .locator('.publish-container .v-list-item-title')
      .all();
    await options[options.length - 1].click();
    // Confirm publish
    const dialog = this.page.locator('div[role="dialog"]');
    await dialog.getByRole('button', { name: 'confirm' }).click();
  }
}
