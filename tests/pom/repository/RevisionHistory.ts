import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

export class RevisionHistory {
  static getRoute = (repositoryId: number) =>
    `/repository/${repositoryId}/root/revisions`;

  static async goTo(page: Page, repositoryId: number) {
    await page.goto(RevisionHistory.getRoute(repositoryId));
    const revisionHistory = new RevisionHistory(page);
    await revisionHistory.expectLoaded();
    return revisionHistory;
  }

  readonly page: Page;
  readonly el: Locator;
  readonly revisions: Locator;

  constructor(page: Page) {
    this.page = page;
    this.el = page.locator('.revision-history');
    this.revisions = page.locator('.revision');
  }

  async expectLoaded() {
    // At least one revision always exists (repository creation)
    await expect(this.revisions.first()).toBeVisible();
  }

  async getCount() {
    return this.revisions.count();
  }

  async expectRevisionExists(text: string) {
    await expect(this.revisions.filter({ hasText: text })).toBeVisible();
  }

  async expectRevisionNotExists(text: string) {
    await expect(this.revisions.filter({ hasText: text })).not.toBeVisible();
  }
}
