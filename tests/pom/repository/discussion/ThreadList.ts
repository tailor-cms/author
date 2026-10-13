import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

import { dragBy, getMenuItem, withExactText } from '../../common/utils';
import { IntegrationsDialog } from './IntegrationsDialog';

export class ThreadListItem {
  readonly page: Page;
  readonly el: Locator;
  readonly starBtn: Locator;

  constructor(page: Page, el: Locator) {
    this.starBtn = el.locator('.thread-list-item-star');
    this.page = page;
    this.el = el;
  }

  async toggleStar() {
    await this.el.hover();
    await this.starBtn.click();
  }
}

export class ThreadList {
  readonly page: Page;
  readonly el: Locator;
  readonly menuBtn: Locator;
  readonly items: Locator;
  readonly newBtn: Locator;
  readonly unreadItems: Locator;
  readonly mentionsChip: Locator;
  readonly nameFilter: Locator;
  readonly markAllReadItem: Locator;
  readonly integrationsItem: Locator;
  readonly resizeHandle: Locator;

  constructor(page: Page) {
    const el = page.locator('.thread-list');
    this.items = el.locator('.thread-list-item');
    this.unreadItems = el.locator('.thread-list-item--unread');
    this.mentionsChip = el.locator('.mentions-chip');
    this.nameFilter = el.getByPlaceholder('Find a conversation');
    this.newBtn = el.getByRole('button', { name: 'New', exact: true });
    this.menuBtn = el.getByRole('button', { name: 'Thread list actions' });
    this.markAllReadItem = getMenuItem(page, 'Mark everything read');
    this.integrationsItem = getMenuItem(page, 'Integrations');
    this.resizeHandle = page.locator('.thread-list-column > .resize-handle');
    this.page = page;
    this.el = el;
  }

  getItemLocator(title: string) {
    return this.items.filter({ hasText: title });
  }

  getItem(title: string) {
    return new ThreadListItem(this.page, this.getItemLocator(title).first());
  }

  getFilterLocator(name: string) {
    return withExactText(this.el.locator('.scope-filter'), name);
  }

  // Group label; e.g. starred section
  getGroupLabelLocator(text: string) {
    return withExactText(this.el.locator('.group-label'), text);
  }

  async openMenu() {
    await this.menuBtn.click();
    await expect(this.markAllReadItem).toBeVisible();
  }

  async markAllRead() {
    await this.openMenu();
    await this.markAllReadItem.click();
  }

  async openIntegrations() {
    await this.openMenu();
    await this.integrationsItem.click();
    const dialog = new IntegrationsDialog(this.page);
    await expect(dialog.el).toBeVisible();
    return dialog;
  }

  resizeBy(deltaX: number) {
    return dragBy(this.page, this.resizeHandle, deltaX);
  }

  async width() {
    return (await this.el.boundingBox())!.width;
  }
}
