import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

import { confirmAction } from '../common/utils';

export class EmojiDialog {
  readonly page: Page;
  readonly el: Locator;
  readonly name: Locator;
  readonly image: Locator;
  readonly saveBtn: Locator;

  constructor(page: Page) {
    const el = page.locator('div[role="dialog"]');
    this.name = el.getByLabel('Shortcode');
    this.image = el.locator('input[type="file"]');
    this.saveBtn = el.getByRole('button', { name: 'Add emoji' });
    this.page = page;
    this.el = el;
  }

  async add(name: string, filePath: string) {
    await this.attachImage(filePath);
    await this.enterName(name);
    await this.save();
  }

  enterName(value: string) {
    return this.name.fill(value);
  }

  attachImage(filePath: string) {
    return this.image.setInputFiles(filePath);
  }

  async save() {
    await this.saveBtn.click();
    await expect(this.el).not.toBeVisible();
  }

  hasVisibleError(message: string | RegExp) {
    return expect(this.el.getByText(message)).toBeVisible();
  }
}

export class EmojiEntry {
  readonly page: Page;
  readonly el: Locator;
  readonly image: Locator;
  readonly removeBtn: Locator;

  constructor(page: Page, el: Locator) {
    this.image = el.locator('img.tile');
    this.removeBtn = el.getByRole('button', { name: /^Remove :/ });
    this.el = el;
    this.page = page;
  }

  async remove() {
    await this.removeBtn.click();
    await confirmAction(this.page);
    await expect(this.el).not.toBeVisible();
  }

  /**
   * Every emoji is served as WebP under its content hash, so it can be
   * cached forever. Animation survives: an animated WebP carries an ANIM
   * chunk, a still one does not.
   */
  async expectServedImage({ isAnimated = false } = {}) {
    const src = await this.image.getAttribute('src');
    expect(src).toMatch(/^\/api\/emoji\/[a-f0-9]{32}\/image$/);
    const res = await this.page.request.get(src!);
    expect(res.ok()).toBeTruthy();
    expect(res.headers()['content-type']).toBe('image/webp');
    expect(res.headers()['cache-control']).toContain('immutable');
    const body = await res.body();
    expect(body.includes('ANIM')).toBe(isAnimated);
  }
}

export class EmojiManagement {
  static route = '/admin/emoji';
  readonly page: Page;
  readonly el: Locator;
  readonly emojiEntriesLocator: Locator;
  readonly addBtn: Locator;
  readonly searchInput: Locator;

  constructor(page: Page) {
    const el = page.locator('.emoji-management');
    this.emojiEntriesLocator = el.locator('tbody tr.v-data-table__tr');
    this.addBtn = el.getByRole('button', { name: 'Add emoji' });
    this.searchInput = el.getByPlaceholder('Search emoji...');
    this.el = el;
    this.page = page;
  }

  static async visit(page: Page) {
    await page.goto(EmojiManagement.route, { waitUntil: 'networkidle' });
    return new EmojiManagement(page);
  }

  async getEntries() {
    const items = await this.emojiEntriesLocator.all();
    return items.map((it) => new EmojiEntry(this.page, it));
  }

  getEntryLocator(name: string): Locator {
    return this.emojiEntriesLocator.filter({ hasText: `:${name}:` });
  }

  async getEntryByName(name: string) {
    const el = this.getEntryLocator(name);
    await expect(el).toBeVisible();
    return new EmojiEntry(this.page, el);
  }

  async openAddDialog() {
    await this.addBtn.click();
    const dialog = new EmojiDialog(this.page);
    await expect(dialog.el).toBeVisible();
    return dialog;
  }

  async addEmoji(name: string, filePath: string) {
    const dialog = await this.openAddDialog();
    await dialog.add(name, filePath);
    return this.getEntryByName(name);
  }

  async removeEmoji(name: string) {
    const entry = await this.getEntryByName(name);
    await entry.remove();
  }
}
