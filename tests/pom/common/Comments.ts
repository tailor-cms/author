import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

import { ConfirmationDialog } from './ConfirmationDialog';

export class Comment {
  static selector = '.comment';
  readonly page: Page;
  readonly el: Locator;
  readonly actionsBtn: Locator;
  readonly resolveBtn: Locator;
  readonly editBtn: Locator;
  readonly removeBtn: Locator;
  readonly confirmationDialog: ConfirmationDialog;

  constructor(page: Page, el: Locator) {
    this.page = page;
    this.el = el;
    this.actionsBtn = el.getByRole('button', { name: 'Comment actions' });
    this.resolveBtn = page
      .locator('.v-list-item')
      .filter({ hasText: 'Resolve' });
    this.editBtn = page.locator('.v-list-item').filter({ hasText: 'Edit' });
    this.removeBtn = page.locator('.v-list-item').filter({ hasText: 'Remove' });
    this.confirmationDialog = new ConfirmationDialog(page, 'Remove comment');
  }

  focus() {
    return this.el.click();
  }

  openActions() {
    return this.actionsBtn.click();
  }

  async resolve() {
    await this.openActions();
    await this.resolveBtn.click();
    await expect(this.page.getByText('Marked as resolved')).toBeVisible();
    await expect(this.page.getByRole('button', { name: 'Undo' })).toBeVisible();
  }

  async toggleEdit() {
    await this.openActions();
    await this.editBtn.click();
  }

  async edit(content: string) {
    await this.toggleEdit();
    // After clicking edit, CommentPreview unmounts (v-if) removing the
    // comment text. The hasText filter on this.el stops matching, so
    // target the editor directly via the unique .comment-editor class.
    const editor = this.page.locator('.comment-editor').first();
    await expect(editor).toBeVisible();
    await editor.getByRole('textbox').fill(content);
    await this.page.getByRole('button', { name: 'Save' }).click();
    await expect(this.page.getByText(content)).toBeVisible();
  }

  async remove() {
    await this.openActions();
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
      ? this.el.locator(Comment.selector, { hasText: content })
      : this.el.locator(Comment.selector).first();
    return new Comment(this.page, element);
  }
}
