import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

import { AddItemDialog } from './AddItemDialog';

class OptionsMenu {
  readonly page: Page;
  readonly el: Locator;

  constructor(page: Page, el: Locator) {
    this.page = page;
    this.el = el;
  }

  toggle() {
    return this.el.click();
  }

  async remove() {
    await this.toggle();
    await this.el.getByLabel('Remove').click();
    // Wait for dialog to open
    const dialogContent = 'Are you sure you want to delete';
    await expect(this.page.getByText(dialogContent)).toBeVisible();
    const dialog = this.page.getByRole('dialog');
    await dialog.getByRole('button', { name: 'Confirm' }).click();
    // Wait for dialog to close
    await expect(this.page.getByText(dialogContent)).not.toBeVisible();
  }
}

export class OutlineItem {
  readonly page: Page;
  readonly el: Locator;
  readonly addItemAboveBtn: Locator;
  readonly addItemBelowBtn: Locator;
  readonly addItemIntoBtn: Locator;
  readonly openBtn: Locator;
  readonly toggleBtn: Locator;
  readonly toggleAltBtn: Locator;
  readonly optionsMenu: OptionsMenu;

  constructor(page: Page, el: Locator) {
    this.page = page;
    this.el = el;
    this.addItemAboveBtn = el.getByRole('button', { name: 'Add item above' });
    this.addItemBelowBtn = el.getByRole('button', { name: 'Add item below' });
    this.addItemIntoBtn = el.getByRole('button', { name: 'Add item into' });
    this.openBtn = el.getByRole('button', { name: 'Open' });
    this.toggleBtn = el.getByRole('button', {
      name: 'Toggle expand',
      exact: true,
    });
    this.toggleAltBtn = el.getByRole('button', { name: 'Toggle expand alt' });
    this.optionsMenu = new OptionsMenu(this.page, el.locator('.options-menu'));
  }

  select() {
    return this.el.click();
  }

  toggleExpand() {
    return this.toggleBtn.click();
  }

  toggleExpandAlt() {
    return this.toggleAltBtn.click();
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
