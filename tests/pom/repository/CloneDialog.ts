import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

export class CloneDialog {
  readonly page: Page;
  readonly el: Locator;
  readonly nameInput: Locator;
  readonly descriptionInput: Locator;
  readonly cloneBtn: Locator;
  readonly cancelBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.el = page.locator('div[role="dialog"]', {
      hasText: 'You are about to clone',
    });
    this.nameInput = this.el.getByLabel('Name');
    this.descriptionInput = this.el.getByLabel('Description');
    this.cloneBtn = this.el.getByRole('button', { name: 'Clone' });
    this.cancelBtn = this.el.getByRole('button', { name: 'Cancel' });
  }

  expectTitle(title: string) {
    return expect(this.el.getByText(title, { exact: true })).toBeVisible();
  }

  // The description is prefilled from the source repository
  expectDescriptionPrefilled() {
    return expect(this.descriptionInput).toHaveValue(/.+/);
  }

  async clone(name: string, description?: string) {
    await this.nameInput.fill(name);
    // Submitting without a description relies on the prefilled source value
    if (description) await this.descriptionInput.fill(description);
    else await this.expectDescriptionPrefilled();
    await this.cloneBtn.click();
    await expect(this.el).not.toBeVisible();
  }

  async cancel() {
    await this.cancelBtn.click();
    await expect(this.el).not.toBeVisible();
  }
}
