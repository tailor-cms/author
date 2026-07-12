import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

import { confirmAction, selectMenuOption } from '../common/utils';
import { CloneDialog } from './CloneDialog';
import { ExportDialog } from './ExportDialog';

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

  async runAction(name: RailAction) {
    await this.actionsMenuBtn.click();
    await selectMenuOption(this.page, name);
  }

  async clone(name = 'Cloned repository') {
    await this.runAction('Clone');
    await new CloneDialog(this.page).clone(name);
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
    return new ExportDialog(this.page).download();
  }

  async delete() {
    await this.runAction('Delete');
    await confirmAction(this.page);
  }
}
