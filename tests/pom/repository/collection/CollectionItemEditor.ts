import type { Locator, Page, Response } from '@playwright/test';
import { CollectionRelationshipField } from './CollectionRelationshipField';
import { HtmlContentElement } from '../../editor/ContentElement';
import { expect } from '@playwright/test';

// The card shown in the editor for a single collection item: entry title +
// content slots (meta inputs and embedded content elements) + relationship
// pickers, all persisted together via Save. Slots are addressed by their config
// key via a `collection-field-<key>` test id.
export class CollectionItemEditor {
  static readonly selector = '.collection-item';

  readonly page: Page;
  readonly el: Locator;
  readonly saveBtn: Locator;
  readonly cancelBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.el = page.locator(CollectionItemEditor.selector);
    this.saveBtn = this.el.getByRole('button', { name: 'Save' });
    this.cancelBtn = this.el.getByRole('button', { name: 'Cancel' });
  }

  async waitReady() {
    await expect(this.el).toBeVisible({ timeout: 15000 });
    return this;
  }

  // A configured content slot wrapper, by its config key.
  field(key: string) {
    return this.el.getByTestId(`collection-field-${key}`);
  }

  // Fill a plain-text meta input (e.g. the entry title) by its label. Real
  // keystrokes + blur so the field's native change handler fires.
  async fillText(label: string, value: string) {
    const input = this.el.getByLabel(label);
    await input.click();
    await input.fill('');
    await input.pressSequentially(value);
    await input.press('Tab');
  }

  // A rich-text meta slot's editor.
  richText(key: string) {
    return this.field(key).locator('.ProseMirror');
  }

  async fillRichText(key: string, value: string) {
    const editor = this.richText(key);
    await editor.click();
    await editor.pressSequentially(value);
    await this.el.click({ position: { x: 4, y: 4 } }); // blur to commit
  }

  // An embedded content element slot, by key.
  contentElement(key: string) {
    const el = this.field(key).locator('.content-element').first();
    return new HtmlContentElement(this.page, el);
  }

  relationship(label: string) {
    return new CollectionRelationshipField(this.page, this.el, label);
  }

  clickSave() {
    return this.saveBtn.click();
  }

  // A committed save: a successful (2xx) non-GET API request.
  private isSuccessfulWrite(response: Response) {
    const method = response.request().method();
    return (
      response.ok() &&
      /\/api\//.test(response.url()) &&
      method !== 'GET' &&
      method !== 'OPTIONS'
    );
  }

  // Save fires its write a tick after the click (async validation), so wait for
  // it before settling. (Dirty state isn't a reliable signal - autosave
  // children re-emit on the post-save render.)
  async save() {
    const saved = this.page
      .waitForResponse((r) => this.isSuccessfulWrite(r), { timeout: 15000 })
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
