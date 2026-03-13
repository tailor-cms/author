import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

export class LinkContentDialog {
  readonly page: Page;
  readonly el: Locator;
  readonly repositoryInput: Locator;
  readonly linkBtn: Locator;
  readonly cancelBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.el = page.locator('div[role="dialog"]', {
      hasText: 'Link existing content',
    });
    this.repositoryInput = this.el.getByLabel('Select a Repository');
    this.linkBtn = this.el
      .locator('.v-card-actions')
      .getByRole('button', { name: /^Link/ });
    this.cancelBtn = this.el.getByRole('button', { name: 'Cancel' });
  }

  async selectRepository(name: string) {
    await this.repositoryInput.click();
    await this.repositoryInput.fill(name);
    const option = this.page.getByRole('option', { name });
    await expect(option.first()).toBeVisible();
    await option.first().click();
    // Wait for activities to load
    await expect(this.el.locator('.v-treeview')).toBeVisible();
  }

  async selectActivity(name: string) {
    const treeItem = this.el.locator('.v-treeview-item', { hasText: name });
    await expect(treeItem).toBeVisible();
    await treeItem.locator('.activity-select-checkbox').click();
  }

  async link() {
    await expect(this.linkBtn).toBeEnabled();
    await this.linkBtn.click();
    // Wait for dialog to close
    await expect(this.el).not.toBeVisible();
  }

  async selectAndLink(repositoryName: string, activityName: string) {
    await this.selectRepository(repositoryName);
    await this.selectActivity(activityName);
    await this.link();
  }
}
