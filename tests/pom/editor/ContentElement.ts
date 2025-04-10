import type { Locator, Page } from '@playwright/test';
import { Comments } from '../common/Comments';

export class ContentElement {
  static selector = '.content-element';
  readonly page: Page;
  readonly el: Locator;
  readonly deleteBtn: Locator;
  readonly commentPopoverToggle: Locator;
  readonly commentsMenu: Locator;
  readonly comments: Comments;

  constructor(page: Page, el: Locator) {
    this.page = page;
    this.el = el;
    this.deleteBtn = el.getByRole('button', { name: 'Delete element' });
    this.commentPopoverToggle = el.getByRole('button', { name: 'View comments' });
    this.commentsMenu = page.locator('.v-menu.element-discussion');
    this.comments = new Comments(page, this.commentsMenu);
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
}
