import type { Locator, Page } from '@playwright/test';

import { Comments } from '../common/Comments';
import { Navigation } from './Navigation';

enum SidebarTab {
  Comments = 'COMMENTS_TAB',
  Browser = 'BROWSER_TAB',
  Element = 'ELEMENT_TAB',
}

export class EditorSidebar {
  readonly page: Page;
  readonly el: Locator;
  readonly tabs: Locator;
  readonly searchInput: Locator;
  readonly toggleAllBtn: Locator;
  readonly treeView: Locator;
  readonly navigation: Navigation;
  readonly comments: Comments;

  constructor(page: Page) {
    this.page = page;
    const el = page.locator('.sidebar-container');
    this.el = el;
    this.tabs = el.getByRole('tablist');
    this.navigation = new Navigation(page, el);
    this.comments = new Comments(page, el);
  }

  getTabByName(name: SidebarTab) {
    return this.tabs.getByRole('tab', { name });
  }

  openCommentsTab() {
    return this.getTabByName(SidebarTab.Comments).click();
  }

  openBrowserTab() {
    return this.getTabByName(SidebarTab.Browser).click();
  }

  openElementTab() {
    return this.getTabByName(SidebarTab.Element).click();
  }

  toggleItems() {
    return this.navigation.toggleItems();
  }

  navigateTo(name: string) {
    return this.navigation.navigateTo(name);
  }
}
