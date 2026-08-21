import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

import {
  confirmAction,
  getMenuOptions,
  selectMenuOption,
} from '../common/utils';
import { CloneDialog } from '../repository/CloneDialog';

export class RepositoryCard {
  readonly page: Page;
  readonly el: Locator;
  readonly addTagBtn: Locator;
  readonly pinBtn: Locator;
  readonly addTagDialog: Locator;
  readonly tagInput: Locator;
  readonly tagErrorMessage: Locator;
  readonly actionsBtn: Locator;
  readonly settingsBtn: Locator;
  readonly selectCheckbox: Locator;

  constructor(page: Page, el: Locator) {
    this.page = page;
    this.el = el;
    this.addTagBtn = el.getByLabel('Add tag');
    this.pinBtn = el.getByLabel('Pin repository');
    this.addTagDialog = page.getByTestId('tailorDialog');
    this.tagInput = this.addTagDialog.locator('input');
    this.tagErrorMessage = this.addTagDialog.getByRole('alert');
    this.actionsBtn = el.getByLabel('Repository actions');
    this.settingsBtn = el.getByLabel('Repository settings');
    this.selectCheckbox = el.getByLabel('Select repository');
  }

  async openSettings() {
    await this.el.hover();
    await this.settingsBtn.click();
  }

  async select() {
    await this.el.hover();
    await this.selectCheckbox.click();
  }

  async runAction(name: 'Clone' | 'Publish' | 'Export' | 'Delete') {
    await this.actionsBtn.click();
    await selectMenuOption(this.page, name);
  }

  // Labels of the card actions menu the acting user is offered
  async getActionLabels() {
    await this.actionsBtn.click();
    return getMenuOptions(this.page);
  }

  async clone(name: string) {
    await this.runAction('Clone');
    await new CloneDialog(this.page).clone(name);
  }

  async publish() {
    await this.runAction('Publish');
    const dialog = this.page.locator('div[role="dialog"]');
    await dialog.getByRole('button', { name: 'Confirm' }).click();
  }

  async delete() {
    await this.runAction('Delete');
    await confirmAction(this.page);
  }

  togglePin() {
    return this.pinBtn.click();
  }

  async addTag(tag: string) {
    await this.addTagBtn.click();
    const nameInput = this.addTagDialog.locator('input');
    await nameInput.fill(tag);
    await nameInput.press('Enter');
    await this.page.waitForTimeout(200);
  }

  async removeTag(tagName: string) {
    const tagSelector = '.v-chip';
    const tag = this.el.locator(tagSelector).filter({ hasText: tagName });
    await expect(tag).toBeVisible();
    await tag.getByLabel('Delete tag').click();
    await this.addTagDialog.getByRole('button', { name: 'confirm' }).click();
  }
}
