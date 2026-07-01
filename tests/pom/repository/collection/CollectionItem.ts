import type { Locator, Page } from '@playwright/test';

import { confirmAction } from '../../common/utils';
import { CollectionItemEditor } from './CollectionItemEditor';

// A single row in the collection list. Selecting it opens the sidebar; the row
// actions open the item in the editor or delete it.
export class CollectionItem {
  static selector = '.collection-row';

  readonly page: Page;
  readonly el: Locator;
  readonly openBtn: Locator;
  readonly deleteBtn: Locator;

  constructor(page: Page, el: Locator) {
    this.page = page;
    this.el = el;
    this.openBtn = el.getByRole('button', { name: 'Open' });
    this.deleteBtn = el.getByRole('button', { name: 'Delete item' });
  }

  select() {
    return this.el.click();
  }

  async open() {
    await this.el.hover();
    await this.openBtn.click();
    return new CollectionItemEditor(this.page).waitReady();
  }

  async openRemoveDialog() {
    await this.el.hover();
    await this.deleteBtn.click();
    return this.page.locator('div[role="dialog"]');
  }

  async confirmRemoval() {
    const deleted = this.page.waitForResponse(
      (r) => r.request().method() === 'DELETE' && r.url().includes('/activities/'),
    );
    const dialog = this.page.locator('div[role="dialog"]');
    await dialog.getByRole('button', { name: 'Confirm' }).click();
    await deleted;
    await this.page.waitForLoadState('networkidle');
  }

  async remove() {
    await this.openRemoveDialog();
    await confirmAction(this.page);
  }
}
