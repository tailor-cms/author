import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { CollectionRelationshipField } from './CollectionRelationshipField';
import { HtmlContentElement } from '../../editor/ContentElement';

// The collection item editor
export class CollectionItemEditor {
  static selector = '.collection-item';
  readonly page: Page;
  readonly el: Locator;
  readonly saveBtn: Locator;
  readonly cancelBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.el = page.locator('.collection-item');
    this.saveBtn = this.el.getByRole('button', { name: 'Save' });
    this.cancelBtn = this.el.getByRole('button', { name: 'Cancel' });
  }

  async waitReady() {
    await expect(this.el).toBeVisible({ timeout: 15000 });
    return this;
  }

  // Fill a plain text meta input (e.g. the entry title) by its label.
  async fillText(label: string, value: string) {
    const input = this.el.getByLabel(label);
    await input.click();
    await input.fill('');
    await input.pressSequentially(value);
    await input.press('Tab');
  }

  // A rich-text meta slot's editor. Embedded content elements (which also use a
  // rich editor) are reached via contentElement(); this is the first standalone
  // one.
  richTextEditor() {
    return this.el.locator('.ProseMirror').first();
  }

  async fillRichText(value: string) {
    const editor = this.richTextEditor();
    await editor.click();
    await editor.pressSequentially(value);
    await this.el.click({ position: { x: 4, y: 4 } }); // blur to commit
  }

  // An embedded content element slot, by its visible label.
  contentElement(label: string) {
    const container = this.el
      .locator('.label')
      .filter({ hasText: label })
      .locator(
        'xpath=following-sibling::div[contains(@class, "element-container")]',
      );
    // A composite element (e.g. a question) nests inner ones; take the outer.
    return new HtmlContentElement(
      this.page,
      container.locator('.content-element').first(),
    );
  }

  relationship(label: string) {
    return new CollectionRelationshipField(this.page, this.el, label);
  }

  clickSave() {
    return this.saveBtn.click();
  }

  // Save fires its write a tick after the click (async validation), so wait for
  // the write response before settling. (Dirty state isn't a reliable signal:
  // autosave children re-emit on the post-save render.)
  async save() {
    const saved = this.page
      .waitForResponse(
        (r) => {
          const method = r.request().method();
          return (
            /\/api\//.test(r.url()) && method !== 'GET' && method !== 'OPTIONS'
          );
        },
        { timeout: 15000 },
      )
      .catch(() => null);
    await this.clickSave();
    await saved;
    await this.page.waitForLoadState('networkidle');
  }

  cancel() {
    return this.cancelBtn.click();
  }

  expectDirty() {
    return expect(this.saveBtn).toBeVisible();
  }

  expectPristine() {
    return expect(this.saveBtn).not.toBeVisible();
  }
}
