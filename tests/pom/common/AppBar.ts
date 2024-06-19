import { Locator, Page } from '@playwright/test';

export class AppBar {
  readonly page: Page;
  readonly el: Locator;
  readonly userMenu: Locator;

  constructor(page: Page) {
    this.page = page;
    this.el = page.locator('#mainAppBar');
    this.userMenu = this.el.getByLabel('User menu');
  }

  async logout() {
    await this.userMenu.click();
    await this.el.getByText('Logout').click();
  }
}
