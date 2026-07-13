import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

interface DialogConfig {
  title: string;
  action: RegExp;
}

// Base for the copy/link dialogs - both pick a source repository, then
// activities from its tree, and submit the selection.
export class SourceContentDialog {
  readonly page: Page;
  readonly el: Locator;
  readonly repositoryInput: Locator;
  readonly submitBtn: Locator;
  readonly cancelBtn: Locator;

  constructor(page: Page, { title, action }: DialogConfig) {
    this.page = page;
    this.el = page.locator('div[role="dialog"]', { hasText: title });
    this.repositoryInput = this.el.getByPlaceholder(/^Type to search/);
    this.submitBtn = this.el
      .locator('.v-card-actions')
      .getByRole('button', { name: action });
    this.cancelBtn = this.el.getByRole('button', { name: 'Cancel' });
  }

  async selectRepository(name: string) {
    await this.repositoryInput.click();
    await this.repositoryInput.fill(name);
    const option = this.page.getByRole('option', { name });
    await expect(option.first()).toBeVisible();
    await option.first().click();
    // Wait for the source activity tree to load
    await expect(this.el.locator('.v-treeview')).toBeVisible();
  }

  async selectActivity(name: string) {
    const treeItem = this.el.locator('.v-treeview-item', { hasText: name });
    await expect(treeItem).toBeVisible();
    await treeItem.locator('.activity-select-checkbox').click();
  }

  async submitSelection() {
    await expect(this.submitBtn).toBeEnabled();
    await this.submitBtn.click();
    // Wait for the dialog to close
    await expect(this.el).not.toBeVisible();
  }

  async selectAndSubmit(repositoryName: string, activityName: string) {
    await this.selectRepository(repositoryName);
    await this.selectActivity(activityName);
    await this.submitSelection();
  }

  async cancel() {
    await this.cancelBtn.click();
    await expect(this.el).not.toBeVisible();
  }
}
