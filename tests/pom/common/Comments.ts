import type { Locator, Page } from '@playwright/test';

export class Comments {
  readonly page: Page;
  readonly el: Locator;
  readonly thread: Locator;
  readonly commentInput: Locator;
  readonly postBtn: Locator;

  constructor(page: Page, parent: Locator) {
    this.page = page;
    this.el = parent.locator('.embedded-discussion');
    this.thread = this.el.locator('.discussion-thread');
    this.commentInput = this.el.locator('textarea').locator('visible=true');
    this.postBtn = this.el.getByRole('button', { name: 'Post comment' });
  }

  async post(comment: string) {
    await this.commentInput.fill(comment);
    await this.postBtn.click();
  }
}
