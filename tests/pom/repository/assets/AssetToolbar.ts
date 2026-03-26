import type { Locator, Page } from '@playwright/test';

export class AssetToolbar {
  static selector = '.asset-toolbar';

  readonly page: Page;
  readonly el: Locator;
  readonly searchInput: Locator;
  readonly uploadBtn: Locator;
  readonly addLinkBtn: Locator;
  readonly discoverBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.el = page.locator(AssetToolbar.selector);
    this.searchInput = this.el.getByPlaceholder('Search assets...');
    this.uploadBtn = this.el.getByRole('button', { name: 'Upload' });
    this.addLinkBtn = this.el.getByRole('button', { name: 'Add Link' });
    this.discoverBtn = this.el.getByRole('button', { name: 'Discover' });
  }

  async uploadFiles(filePaths: string[]) {
    const [fileChooser] = await Promise.all([
      this.page.waitForEvent('filechooser'),
      this.uploadBtn.click(),
    ]);
    await fileChooser.setFiles(filePaths);
    await this.page.waitForLoadState('networkidle');
  }
}
