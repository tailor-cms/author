import type { Locator, Page } from '@playwright/test';

export class AppBar {
  readonly page: Page;
  readonly el: Locator;
  readonly adminLink: Locator;
  readonly catalogLink: Locator;
  readonly userMenu: Locator;
  readonly repositorySwitcher: Locator;
  readonly repositorySwitcherSearch: Locator;
  readonly repositoryList: Locator;

  constructor(page: Page) {
    this.page = page;
    this.el = page.locator('#mainAppBar');
    this.catalogLink = this.el.getByRole('link', { name: 'Catalog' });
    this.adminLink = this.el.getByRole('link', { name: 'Admin' });
    this.userMenu = this.el.getByLabel('User menu');
    this.repositorySwitcher = this.el.locator('.repository-selector');
    this.repositorySwitcherSearch = page.getByPlaceholder('Search repositories');
    this.repositoryList = page.locator('.repository-list');
  }

  async openUserMenu() {
    await this.userMenu.click();
  }

  async logout() {
    await this.openUserMenu();
    await this.el.getByText('Logout').click();
  }

  async goToAdmin() {
    await this.openUserMenu();
    await this.adminLink.click();
  }

  async openRepositorySwitcher() {
    await this.repositorySwitcher.click();
    await this.repositoryList.waitFor();
  }

  async closeRepositorySwitcher() {
    await this.page.keyboard.press('Escape');
    await this.repositoryList.waitFor({ state: 'hidden' });
  }

  repositoryItems() {
    return this.repositoryList.locator('.v-list-item');
  }

  repositoryItem(name: string) {
    return this.repositoryItems().filter({ hasText: name });
  }

  searchRepositories(term: string) {
    return this.repositorySwitcherSearch.fill(term);
  }

  switchToRepository(name: string) {
    return this.repositoryItem(name).click();
  }

  recentRemoveButton(name: string) {
    return this.repositoryItem(name).getByRole('button', {
      name: `Remove ${name} from recents`,
    });
  }

  removeRecent(name: string) {
    return this.recentRemoveButton(name).click();
  }
}
