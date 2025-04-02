import type { Locator, Page } from '@playwright/test';
import { ConfirmationDialog } from './ConfirmationDialog';

export class Comment {
  static selector = '.comment';
  readonly page: Page;
  readonly el: Locator;
  readonly resolveBtn: Locator;
  readonly editBtn: Locator;
  readonly removeBtn: Locator;
  readonly confirmationDialog: ConfirmationDialog;

  constructor(page: Page, el: Locator) {
    this.page = page;
    this.el = el;
    this.resolveBtn = el.getByRole('button', { name: 'Resolve comment' });
    this.editBtn = el.getByRole('button', { name: 'Edit comment' });
    this.removeBtn = el.getByRole('button', { name: 'Remove comment' });
    this.confirmationDialog = new ConfirmationDialog(page, 'Remove comment');
  }

  focus() {
    return this.el.click();
  }

  resolve() {
    return this.resolveBtn.click();
  }

  toggleEdit() {
    return this.editBtn.click();
  }

  async remove() {
    await this.removeBtn.click();
    await this.confirmationDialog.confirm();
  }
}

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

  getComment(content?: string) {
    const element = content
      ? this.page.locator(Comment.selector, { hasText: content })
      : this.page.locator(Comment.selector).first();
    return new Comment(this.page, element);
  }
}
