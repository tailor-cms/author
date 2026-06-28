import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

import { confirmAction } from '../common/utils';
import { EditorSidebar } from './Sidebar';

export class EditorHistory {
  readonly page: Page;
  readonly sidebar: EditorSidebar;
  readonly panel: Locator;
  readonly items: Locator;
  readonly toolbar: Locator;
  readonly restoreBtn: Locator;
  readonly exitBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.sidebar = new EditorSidebar(page);
    this.panel = page.locator('.activity-history');
    this.items = page.locator('.history-item');
    this.toolbar = page.locator('.history-toolbar');
    this.restoreBtn = page.getByRole('button', { name: 'Restore this version' });
    this.exitBtn = page.getByRole('button', { name: 'Exit history view' });
  }

  async open() {
    await this.sidebar.openHistoryTab();
    await expect(this.panel).toBeVisible();
  }

  getItem(text: string) {
    return this.items.filter({ hasText: text });
  }

  async preview(text: string) {
    await this.getItem(text).first().click();
    await expect(this.toolbar).toBeVisible();
  }

  async restore() {
    await this.restoreBtn.click();
    await confirmAction(this.page);
  }

  async exit() {
    await this.exitBtn.click();
    await expect(this.toolbar).toBeHidden();
  }
}
