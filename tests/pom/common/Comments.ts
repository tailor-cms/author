import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

import {
  MessageComposer,
  MessageEditor,
} from '../repository/discussion/MessageComposer';
import {
  MessageBody,
  MessagePreviews,
  MessageReactions,
} from '../repository/discussion/ThreadMessage';
import { ConfirmationDialog } from './ConfirmationDialog';
import { EmojiPicker } from '../repository/discussion/EmojiPicker';
import { getMenuItem } from './utils';

type CommentAction = 'Resolve' | 'Edit' | 'Remove';

export class Comment {
  static selector = '.comment';

  readonly page: Page;
  readonly el: Locator;
  readonly body: MessageBody;
  readonly previews: MessagePreviews;
  readonly reactions: MessageReactions;
  readonly reactBtn: Locator;
  readonly menuBtn: Locator;
  readonly resolvedNote: Locator;
  readonly removeDialog: ConfirmationDialog;
  readonly editor: MessageEditor;

  constructor(page: Page, el: Locator, list: Locator) {
    this.body = new MessageBody(el);
    this.previews = new MessagePreviews(el);
    this.reactions = new MessageReactions(page, el);
    this.reactBtn = el.getByRole('button', {
      name: 'Add reaction',
      exact: true,
    });
    this.menuBtn = el.getByRole('button', {
      name: 'Comment actions',
      exact: true,
    });
    this.resolvedNote = el.locator('.resolvement-options');
    this.editor = new MessageEditor(page, list);
    this.removeDialog = new ConfirmationDialog(page, 'Remove comment');
    this.page = page;
    this.el = el;
  }

  openMenu() {
    return this.menuBtn.click();
  }

  getMenuItemLocator(name: CommentAction) {
    return getMenuItem(this.page, name);
  }

  async runAction(name: CommentAction) {
    await this.openMenu();
    await this.getMenuItemLocator(name).click();
  }

  async startEdit() {
    await this.runAction('Edit');
    await expect(this.editor.el).toBeVisible();
  }

  async edit(text: string) {
    await this.startEdit();
    await this.editor.save(text);
  }

  async resolve() {
    await this.runAction('Resolve');
    await expect(this.resolvedNote).toBeVisible();
  }

  async remove() {
    await this.runAction('Remove');
    await this.removeDialog.confirm();
    await expect(this.el).not.toBeVisible();
  }

  async react(query: string) {
    await this.reactBtn.click();
    await new EmojiPicker(this.page).pick(query);
  }
}

export class Comments {
  readonly page: Page;
  readonly el: Locator;
  readonly thread: Locator;
  readonly rows: Locator;
  readonly showMoreBtn: Locator;
  readonly unseenDivider: Locator;
  readonly composer: MessageComposer;
  readonly resolveAllBtn: Locator;
  readonly resolveAllDialog: ConfirmationDialog;

  constructor(page: Page, parent: Locator) {
    const el = parent.locator('.embedded-discussion');
    this.composer = new MessageComposer(page, el);
    this.thread = el.locator('.discussion-thread');
    this.rows = this.thread.locator(Comment.selector);
    this.showMoreBtn = el.getByRole('button', {
      name: /^Show (more|less)$/,
    });
    this.unseenDivider = this.thread.locator(
      '.v-divider__wrapper:has(.unseen-divider)',
    );
    this.resolveAllBtn = el.getByRole('button', {
      name: 'Resolve All',
      exact: true,
    });
    this.resolveAllDialog = new ConfirmationDialog(page, 'Resolve all comments');
    this.page = page;
    this.el = el;
  }

  getComment(content?: string) {
    const rows = content ? this.rows.filter({ hasText: content }) : this.rows;
    return new Comment(this.page, rows.first(), this.el);
  }

  getLastComment() {
    return new Comment(this.page, this.rows.last(), this.el);
  }

  async post(text: string) {
    await this.composer.post(text);
    await expect(this.getComment(text).el).toBeVisible();
  }

  async editLast() {
    await this.composer.input.click();
    await this.page.keyboard.press('ArrowUp');
  }

  async resolveAll() {
    await this.resolveAllBtn.click();
    await this.resolveAllDialog.confirm();
  }
}
