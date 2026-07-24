import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

export class Toast {
  readonly page: Page;
  readonly el;

  constructor(page: Page) {
    this.page = page;
    this.el = page.locator('.v-snackbar');
  }

  private withText(text: string | RegExp) {
    return this.el.filter({ hasText: text }).first();
  }

  hasText(text: string | RegExp) {
    return expect(this.withText(text)).toBeVisible();
  }

  isSaved() {
    return expect(this.withText(/saved/i)).toBeVisible();
  }

  waitForDismiss() {
    return expect(this.el).toHaveCount(0);
  }

  // Named confirmation toasts
  expectCreated(label: string) {
    return this.hasText(`A new ${label} has been created`);
  }

  expectImportSucceeded() {
    return this.hasText('Import successful');
  }

  // Shown when a repository is opened without view access (403).
  expectRepositoryAccessDenied() {
    return this.hasText('You do not have access to this repository.');
  }

  expectCloned(label: string) {
    return this.expectConfirmed(label, 'cloned');
  }

  expectCopied(label: string) {
    return this.expectConfirmed(label, 'copied');
  }

  expectLinked(label: string) {
    return this.expectConfirmed(label, 'linked');
  }

  expectPublished(label: string) {
    return this.expectConfirmed(label, 'published');
  }

  expectExported(label: string) {
    return this.expectConfirmed(label, 'exported');
  }

  expectDeleted(label: string) {
    return this.expectConfirmed(label, 'deleted');
  }

  // Bulk variant, e.g. expectDeletedMany('2 Courses')
  expectDeletedMany(countLabel: string) {
    return this.hasText(`${countLabel} have been deleted`);
  }

  private expectConfirmed(label: string, verb: string) {
    return this.hasText(`The ${label} has been ${verb}`);
  }
}
