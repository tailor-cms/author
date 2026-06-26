import type { Locator, Page } from '@playwright/test';

export class AssetToolbar {
  static selector = '.asset-toolbar';

  readonly page: Page;
  readonly el: Locator;
  readonly searchInput: Locator;
  readonly newMenuBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.el = page.locator(AssetToolbar.selector);
    this.searchInput = this.el.getByPlaceholder('Search assets...');
    this.newMenuBtn = this.el.getByTestId('newMenuBtn');
  }

  // Create actions (New folder / Upload files / Add link) live behind the
  // "+ New" menu; the items render in an overlay outside the toolbar.
  async openNewMenu() {
    await this.newMenuBtn.click();
  }

  async uploadFiles(filePaths: string[]) {
    await this.openNewMenu();
    const [fileChooser] = await Promise.all([
      this.page.waitForEvent('filechooser'),
      this.page.getByTestId('uploadAction').click(),
    ]);
    await fileChooser.setFiles(filePaths);
    await this.page.waitForLoadState('networkidle');
  }

  async openAddLink() {
    await this.openNewMenu();
    await this.page.getByTestId('addLinkAction').click();
  }

  async openNewFolder() {
    await this.openNewMenu();
    await this.page.getByTestId('newFolderAction').click();
  }

  async openDiscover() {
    await this.openNewMenu();
    await this.page.getByTestId('discoverAction').click();
  }
}
