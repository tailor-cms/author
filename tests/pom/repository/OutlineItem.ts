import { Locator, Page } from '@playwright/test';

import { AddItemDialog } from './AddItemDialog';

export class OutlineItem {
  readonly page: Page;
  readonly el: Locator;
  readonly addItemAboveBtn: Locator;
  readonly addItemBelowBtn: Locator;
  readonly addItemIntoBtn: Locator;
  readonly openBtn: Locator;

  constructor(page: Page, el: Locator) {
    this.page = page;
    this.el = el;
    this.addItemAboveBtn = el.getByRole('button', { name: 'Add item above' });
    this.addItemBelowBtn = el.getByRole('button', { name: 'Add item below' });
    this.addItemIntoBtn = el.getByRole('button', { name: 'Add item into' });
    this.openBtn = el.getByRole('button', { name: 'Open' });
  }

  async select() {
    await this.el.click();
  }

  async addAbove(type: string, name: string) {
    await this.el.click();
    await this.addItemAboveBtn.click();
    return this.submitAddItemDialog(type, name);
  }

  async addBelow(type: string, name: string) {
    await this.el.click();
    await this.addItemBelowBtn.click();
    return this.submitAddItemDialog(type, name);
  }

  async addInto(type: string, name: string) {
    await this.el.click();
    await this.addItemIntoBtn.click();
    return this.submitAddItemDialog(type, name);
  }

  private submitAddItemDialog(type: string, name: string) {
    const dialog = new AddItemDialog(this.page);
    return dialog.create(type, name);
  }
}
