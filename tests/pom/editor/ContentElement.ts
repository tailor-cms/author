import type { Locator, Page } from '@playwright/test';
import { Comments } from '../common/Comments';

export class ContentElement {
  static selector = '.content-element';
  readonly page: Page;
  readonly el: Locator;
  readonly deleteBtn: Locator;
  readonly commentBtn: Locator;
  readonly commentsMenu: Locator;
  readonly comments: Comments;

  constructor(page: Page, el: Locator) {
    this.page = page;
    this.el = el;
    this.deleteBtn = el.getByRole('button', { name: 'Delete element' });
    this.commentBtn = el.getByRole('button', { name: 'View comments' });
    this.commentsMenu = page.locator('.v-menu');
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
    await this.commentBtn.click();
    await this.commentsMenu.isVisible();
  }

  async comment(text: string) {
    await this.openComments();
    await this.comments.post(text);
  }
}
