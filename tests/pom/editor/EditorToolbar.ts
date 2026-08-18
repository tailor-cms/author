import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

import { Toast } from '../common/Toast';

export class EditorToolbar {
  readonly page: Page;
  readonly el: Locator;
  readonly title: Locator;
  readonly linkIcon: Locator;
  readonly viewSourceBtn: Locator;
  readonly unlinkBtn: Locator;
  readonly publishBtn: Locator;
  readonly compareBtn: Locator;
  readonly previousActivityBtn: Locator;
  readonly nextActivityBtn: Locator;
  readonly toast: Toast;

  constructor(page: Page) {
    this.page = page;
    this.el = page.locator('.activity-toolbar');
    this.title = this.el.locator('.activity-title');
    this.linkIcon = this.el.locator('.link-icon');
    this.viewSourceBtn = this.el.getByRole('button', { name: 'View source' });
    this.unlinkBtn = this.el.getByRole('button', { name: 'Unlink' });
    this.publishBtn = this.el.getByRole('button', { name: 'Publish', exact: true });
    this.compareBtn = this.el.getByRole('button', { name: 'Compare' });
    this.previousActivityBtn = this.el.getByTestId('editor-pagination-previous');
    this.nextActivityBtn = this.el.getByTestId('editor-pagination-next');
    this.toast = new Toast(page);
  }

  async previousActivityName() {
    const label = await this.previousActivityBtn.getAttribute('aria-label');
    return (label ?? '').replace(/^Previous:\s*/, '');
  }

  async nextActivityName() {
    const label = await this.nextActivityBtn.getAttribute('aria-label');
    return (label ?? '').replace(/^Next:\s*/, '');
  }

  // Both wait for the target to land, so callers can read the new neighbours
  // straight after - `getAttribute` does not retry.
  async toPreviousActivity() {
    const target = await this.previousActivityName();
    await this.previousActivityBtn.click();
    await expect(this.el).toContainText(target);
  }

  async toNextActivity() {
    const target = await this.nextActivityName();
    await this.nextActivityBtn.click();
    await expect(this.el).toContainText(target);
  }

  async expectAtSequenceStart() {
    await expect(this.previousActivityBtn).toBeDisabled();
    await expect(this.nextActivityBtn).toBeEnabled();
  }

  async expectAtSequenceEnd() {
    await expect(this.nextActivityBtn).toBeDisabled();
    await expect(this.previousActivityBtn).toBeEnabled();
  }

  async expectNoPagination() {
    await expect(this.previousActivityBtn).toHaveCount(0);
    await expect(this.nextActivityBtn).toHaveCount(0);
  }

  async expectLinkedState() {
    await expect(this.linkIcon).toBeVisible();
    await expect(this.viewSourceBtn).toBeVisible();
    await expect(this.unlinkBtn).toBeVisible();
  }

  async expectDefaultState() {
    await expect(this.linkIcon).not.toBeVisible();
    await expect(this.viewSourceBtn).not.toBeVisible();
    await expect(this.unlinkBtn).not.toBeVisible();
  }

  async viewSource() {
    await this.viewSourceBtn.click();
  }

  async unlink() {
    await this.unlinkBtn.click();
    await this.toast.hasText('unlinked');
  }

  async publish() {
    await this.publishBtn.click();
    const dialog = this.page.locator('div[role="dialog"]');
    await dialog.getByRole('button', { name: 'confirm' }).click();
    // The confirm dialog closes immediately (fire-and-forget); wait for the
    // publish request to settle so `publishedAt` is set.
    await this.page.waitForLoadState('networkidle');
  }

  async compareWithPublished() {
    await this.compareBtn.click();
  }
}
