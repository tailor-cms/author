import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

type RailAction = 'Clone' | 'Publish' | 'Export' | 'Delete';

export class NavigationRail {
  readonly page: Page;
  readonly el: Locator;
  readonly actionsMenuBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.el = page.locator('.navigation-rail');
    this.actionsMenuBtn = this.el.locator('.rail-menu-btn');
  }

  getTab(name: 'Structure' | 'Editor' | 'Progress' | 'History' | 'Assets' | 'Settings') {
    return this.el.getByRole('tab', { name, exact: true });
  }

  goToStructure() {
    return this.getTab('Structure').click();
  }

  goToEditor() {
    return this.getTab('Editor').click();
  }

  goToProgress() {
    return this.getTab('Progress').click();
  }

  goToHistory() {
    return this.getTab('History').click();
  }

  goToAssets() {
    return this.getTab('Assets').click();
  }

  goToSettings() {
    return this.getTab('Settings').click();
  }

  async openActionsMenu() {
    await this.actionsMenuBtn.click();
    const menu = this.page.locator('.v-overlay.v-menu').last();
    await expect(menu).toBeVisible();
    return menu;
  }

  async runAction(name: RailAction) {
    const menu = await this.openActionsMenu();
    await menu.locator('.v-list-item-title').filter({ hasText: name }).click();
  }
}
