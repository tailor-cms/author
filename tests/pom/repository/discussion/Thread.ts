import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

import { getMenuItem } from '../../common/utils';
import { MessageComposer } from './MessageComposer';
import { MessageEditor } from './MessageEditor';
import { SharedFilesDialog } from './SharedFilesDialog';
import { SubscriptionsDialog } from './SubscriptionsDialog';
import { ThreadMessage } from './ThreadMessage';

export class Thread {
  readonly page: Page;
  readonly el: Locator;
  readonly title: Locator;
  // If the thread is anchored to a specific piece of content
  readonly anchorChip: Locator;
  readonly menuBtn: Locator;
  readonly messages: Locator;
  // Day labels and the unread marker between messages
  readonly dividers: Locator;
  readonly unreadDivider: Locator;
  // Card shown while a reference chip is hovered, drawn outside the panel
  readonly referencePreview: Locator;
  // Who else is writing in this thread right now
  readonly typingIndicator: Locator;
  readonly composer: MessageComposer;
  readonly editor: MessageEditor;

  constructor(page: Page) {
    const el = page.locator('.thread-pane');
    this.title = el.locator('.thread-title');
    this.anchorChip = el.locator('.anchor-chip');
    this.menuBtn = el.getByRole('button', { name: 'Thread actions' });
    this.messages = el.locator('.message-row');
    this.dividers = el.locator('.timeline-divider-chip');
    this.unreadDivider = el.locator('.unread-divider').first();
    this.referencePreview = page.locator('.reference-preview');
    this.typingIndicator = el.locator('.typing-indicator');
    this.composer = new MessageComposer(page, el);
    this.editor = new MessageEditor(page, el);
    this.page = page;
    this.el = el;
  }

  getMessageLocator(text: string) {
    return this.messages.filter({ hasText: text });
  }

  getDividerLocator(text: string) {
    return this.dividers.filter({ hasText: text });
  }

  getMessage(text: string) {
    return new ThreadMessage(this.page, this.getMessageLocator(text).first(), this.el);
  }

  getLastMessage() {
    return new ThreadMessage(this.page, this.messages.last(), this.el);
  }

  openReplies(text: string) {
    return this.getMessage(text).openReplies();
  }

  openMenu() {
    return this.menuBtn.click();
  }

  getMenuItemLocator(name: string) {
    return getMenuItem(this.page, name);
  }

  async runAction(name: string) {
    await this.openMenu();
    await this.getMenuItemLocator(name).click();
  }

  async openSubscriptions() {
    await this.runAction('Subscribe to updates');
    const dialog = new SubscriptionsDialog(this.page);
    await expect(dialog.el).toBeVisible();
    return dialog;
  }

  async openSharedFiles() {
    await this.runAction('Shared files');
    const dialog = new SharedFilesDialog(this.page);
    await expect(dialog.el).toBeVisible();
    return dialog;
  }

  async editLast(text: string) {
    await this.composer.input.click();
    await this.page.keyboard.press('ArrowUp');
    await this.editor.save(text);
  }

  async expectMessage(text: string) {
    await expect(this.getMessageLocator(text)).toBeVisible();
  }
}
