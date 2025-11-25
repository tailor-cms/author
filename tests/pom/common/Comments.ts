import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

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

  async resolve() {
    await this.resolveBtn.click();
    await expect(this.page.getByText('Marked as resolved')).toBeVisible();
    await expect(this.page.getByRole('button', { name: 'Undo' })).toBeVisible();
  }

  toggleEdit() {
    return this.editBtn.click();
  }

  async edit(content: string) {
    await this.toggleEdit();
    const input = this.page.locator('.comment-editor textarea')
      .locator('visible=true');
    const saveBtn = this.page.getByRole('button', { name: 'Save' });
    await input.fill(content);
    await saveBtn.click();
    await expect(this.page.getByText(content)).toBeVisible();
  }

  async remove() {
    await this.removeBtn.click();
    await this.confirmationDialog.confirm();
    await expect(this.el).not.toBeVisible();
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
    await expect(this.page.getByText(comment)).toBeVisible();
  }

  getComment(content?: string) {
    const element = content
      ? this.page.locator(Comment.selector, { hasText: content })
      : this.page.locator(Comment.selector).first();
    return new Comment(this.page, element);
  }
}
