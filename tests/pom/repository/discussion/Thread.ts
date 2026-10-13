import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

import { getDialog, getMenuItem } from '../../common/utils';
import { MessageComposer, MessageEditor } from './MessageComposer';
import { ThreadMessage } from './ThreadMessage';

export class NewThread {
  readonly page: Page;
  readonly el: Locator;
  readonly titleInput: Locator;
  readonly composer: MessageComposer;

  constructor(page: Page) {
    const el = page.locator('.start-discussion');
    this.titleInput = el.getByPlaceholder('Subject');
    this.composer = new MessageComposer(page, el);
    this.page = page;
    this.el = el;
  }
}

// Files attached to the thread's messages
export class SharedFilesDialog {
  readonly page: Page;
  readonly el: Locator;
  readonly files: Locator;

  constructor(page: Page) {
    const el = getDialog(page, 'Shared files');
    this.files = el.locator('.asset-tile');
    this.page = page;
    this.el = el;
  }

  getFileLocator(name: string) {
    return this.files.filter({ hasText: name });
  }
}

// Repository events and integrations reported into the thread
export class SubscriptionsDialog {
  readonly page: Page;
  readonly el: Locator;
  readonly options: Locator;
  readonly saveBtn: Locator;

  constructor(page: Page) {
    const el = getDialog(page, 'Subscribe to updates');
    this.options = el.getByRole('checkbox');
    this.saveBtn = el.getByRole('button', { name: 'Save', exact: true });
    this.page = page;
    this.el = el;
  }

  getOptionLocator(label: string) {
    return this.el.getByRole('checkbox', { name: label });
  }

  async subscribe(labels: string[]) {
    await expect(this.options.first()).toBeVisible();
    for (const label of labels) await this.getOptionLocator(label).check();
    await this.saveBtn.click();
    await expect(this.el).not.toBeVisible();
  }
}

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
    const el = page.locator('.thread-panel');
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
