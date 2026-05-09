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

  getTab(
    name:
      | 'Structure'
      | 'Items'
      | 'Editor'
      | 'Progress'
      | 'History'
      | 'Assets'
      | 'Settings',
  ) {
    return this.el.getByRole('tab', { name, exact: true });
  }

  goToStructure() {
    return this.el.getByRole('tab', { name: /^(Structure|Items)$/ }).click();
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

  async clone(name = 'Cloned repository') {
    await this.runAction('Clone');
    const dialog = this.page.locator('div[role="dialog"]');
    await dialog.getByLabel('Name').fill(name);
    await dialog.getByLabel('Description').fill('Test description');
    await dialog.getByRole('button', { name: 'Clone' }).click();
    await expect(dialog).not.toBeVisible();
  }

  async publish() {
    await this.runAction('Publish');
    const dialog = this.page.locator('div[role="dialog"]');
    await dialog.getByRole('button', { name: 'Confirm' }).click();
    await expect(dialog.getByText('Please wait...')).toBeVisible();
    await expect(dialog.getByText('Please wait...')).not.toBeVisible({
      timeout: 10000,
    });
  }

  async export() {
    await this.runAction('Export');
    const dialog = this.page.locator('div[role="dialog"]');
    await expect(dialog.getByText('Repository export is ready.')).toBeVisible({
      timeout: 10000,
    });
    const downloadEvent = this.page.waitForEvent('download');
    await dialog.getByRole('button', { name: 'Download' }).click();
    const download = await downloadEvent;
    const path = `tmp/${download.suggestedFilename()}`;
    await download.saveAs(path);
    return path;
  }

  async delete() {
    await this.runAction('Delete');
    const dialog = this.page.locator('div[role="dialog"]');
    await dialog.getByRole('button', { name: 'confirm' }).click();
  }
}
