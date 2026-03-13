import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

import { Comments } from '../common/Comments';

export class ContentElement {
  static selector = '.content-element';
  readonly page: Page;
  readonly el: Locator;
  readonly deleteBtn: Locator;
  readonly commentPopoverToggle: Locator;
  readonly commentsMenu: Locator;
  readonly comments: Comments;
  readonly sourceUsagesBtn: Locator;
  readonly linkedIndicatorBtn: Locator;
  readonly commentDisabledBtn: Locator;

  constructor(page: Page, el: Locator) {
    this.page = page;
    this.el = el;
    this.deleteBtn = el.getByRole('button', { name: 'Delete element' });
    this.commentPopoverToggle = el.getByRole('button', {
      name: 'View comments',
    });
    this.commentsMenu = page.locator('.v-menu.element-discussion');
    this.comments = new Comments(page, this.commentsMenu);
    this.linkedIndicatorBtn = el.getByRole('button', {
      name: 'Linked content',
    });
    this.commentDisabledBtn = el.getByRole('button', {
      name: 'Comments disabled',
    });
    this.sourceUsagesBtn = el.getByRole('button', { name: 'Source usages' });
  }

  async focus() {
    await this.el.click();
  }

  async remove() {
    await this.el.hover();
    await this.deleteBtn.click();
    const dialog = this.page.locator('div[role="dialog"]');
    await dialog.getByRole('button', { name: 'confirm' }).click();
  }

  async openComments() {
    await this.el.hover();
    await this.commentPopoverToggle.click();
    await this.commentsMenu.isVisible();
  }

  async getComment(content?: string) {
    await this.openComments();
    return this.comments.getComment(content);
  }

  async postComment(text: string) {
    await this.openComments();
    await this.comments.post(text);
  }

  async expectLinked() {
    await expect(this.el).toHaveClass(/linked/);
  }

  async expectNotLinked() {
    await expect(this.el).not.toHaveClass(/linked/);
  }

  async openLinkedMenu() {
    await this.el.hover();
    await this.linkedIndicatorBtn.click();
    return new ElementLinkedMenu(this.page);
  }

  async openSourceUsagesMenu() {
    await this.el.hover();
    await this.sourceUsagesBtn.click();
    return new ElementSourceUsagesMenu(this.page);
  }

  async openCommentDisabledMenu() {
    await this.el.hover();
    await this.commentDisabledBtn.click();
  }

  async dragToReorder(offsetY: number) {
    // Drag handle is in ancestor .contained-content, not inside .content-element
    const xpath = 'ancestor::div[contains(@class, "contained-content")]';
    const container = this.el.locator(`xpath=${xpath}`);
    await container.hover();
    const dragHandle = container.locator('.drag-handle');
    await expect(dragHandle).toBeVisible();
    const box = await dragHandle.boundingBox();
    if (!box) throw new Error('Could not get drag handle bounding box');
    const centerX = box.x + box.width / 2;
    const centerY = box.y + box.height / 2;
    await this.page.mouse.move(centerX, centerY);
    await this.page.mouse.down();
    await this.page.mouse.move(centerX, centerY + offsetY);
    await this.page.mouse.up();
  }
}

export class ElementLinkedMenu {
  readonly page: Page;
  readonly el: Locator;

  constructor(page: Page) {
    this.page = page;
    this.el = page.locator('.element-linked-indicator');
  }

  async expectNoUnlinkAction() {
    await expect(this.el).toBeVisible();
    await expect(this.el.getByText('Unlink')).not.toBeVisible();
  }

  async expectViewSourceAction() {
    await expect(this.el).toBeVisible();
    await expect(
      this.el.getByText('View Source', { exact: false }),
    ).toBeVisible();
  }
}

export class ElementSourceUsagesMenu {
  readonly page: Page;
  readonly el: Locator;

  constructor(page: Page) {
    this.page = page;
    this.el = page.locator('.element-source-usages');
  }

  async expectHasUsages() {
    await expect(this.el).toBeVisible();
    await expect(
      this.el.locator('.text-caption', { hasText: 'Linked Copies' }),
    ).toBeVisible();
    await expect(this.el.locator('.v-list-item').first()).toBeVisible({ timeout: 10000 });
  }
}

export class HtmlContentElement extends ContentElement {
  readonly tiptap: Locator;

  constructor(page: Page, el: Locator) {
    super(page, el);
    this.tiptap = el.locator('.tiptap');
  }

  async fill(content: string) {
    await this.tiptap.click();
    await this.tiptap.pressSequentially(content);
  }
}
