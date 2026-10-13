import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

import { getMenuItem, pickEmoji } from '../../common/utils';
import { MessageEditor } from './MessageEditor';
import { ThreadReplies } from './ThreadReplies';

const CUSTOM_EMOJI = '.emoji-glyph--custom';

export class MessageBody {
  readonly el: Locator;
  readonly tokens: Locator;
  readonly inlineCode: Locator;
  readonly codeBlock: Locator;
  readonly codeBlockText: Locator;
  readonly codeBlockLanguage: Locator;
  readonly customEmoji: Locator;
  readonly editedLabel: Locator;

  constructor(parent: Locator) {
    const el = parent.locator('.message-body');
    this.tokens = el.locator('.message-token');
    this.inlineCode = el.locator('.code-inline');
    this.codeBlock = el.locator('.code-block');
    this.codeBlockText = this.codeBlock.locator('code');
    this.codeBlockLanguage = this.codeBlock.locator('.code-language');
    this.customEmoji = el.locator(CUSTOM_EMOJI);
    this.editedLabel = el.locator('.message-edited');
    this.el = el;
  }
}

export class MessagePreviews {
  readonly card: Locator;
  readonly image: Locator;
  readonly thumbnail: Locator;

  constructor(parent: Locator) {
    this.card = parent.locator('.preview-card');
    this.image = parent.locator('.image-preview');
    this.thumbnail = this.image.getByRole('img');
  }
}

export class MessageReactions {
  readonly page: Page;
  readonly el: Locator;
  readonly pills: Locator;
  readonly customEmoji: Locator;
  // Shown beside the pills once the message has any reactions
  readonly addBtn: Locator;

  constructor(page: Page, parent: Locator) {
    const el = parent.locator('.message-reactions');
    this.pills = el.locator('.reaction-pill');
    this.customEmoji = this.pills.locator(CUSTOM_EMOJI);
    this.addBtn = el.getByRole('button', {
      name: 'Add another reaction',
      exact: true,
    });
    this.page = page;
    this.el = el;
  }

  async add(query: string) {
    await this.addBtn.click();
    await pickEmoji(this.page, query);
  }
}

// React, reply and the author's menu, shown while the message is hovered.
export class MessageToolbar {
  readonly page: Page;
  readonly el: Locator;
  readonly message: Locator;
  readonly reactBtn: Locator;
  readonly replyBtn: Locator;
  readonly menuBtn: Locator;

  constructor(page: Page, message: Locator) {
    const el = message.locator('.message-actions');
    const getButton = (name: string) =>
      el.getByRole('button', { name, exact: true });
    this.reactBtn = getButton('Add reaction');
    this.replyBtn = getButton('Reply in thread');
    this.menuBtn = getButton('More actions');
    this.page = page;
    this.message = message;
    this.el = el;
  }

  reveal() {
    return this.message.hover();
  }

  async openMenu() {
    await this.reveal();
    await this.menuBtn.click();
  }

  async runAction(name: string) {
    await this.openMenu();
    await getMenuItem(this.page, name).click();
  }
}

// Message in a thread or its replies
export class ThreadMessage {
  readonly page: Page;
  readonly el: Locator;
  readonly panel: Locator;
  readonly header: Locator;
  readonly toolbar: MessageToolbar;
  readonly body: MessageBody;
  readonly reactions: MessageReactions;
  readonly replyFooter: Locator;
  readonly previews: MessagePreviews;
  readonly integrationBadge: Locator;
  // Cards an integration posts along with the text
  readonly attachments: Locator;
  readonly assetTiles: Locator;

  constructor(page: Page, el: Locator, panel: Locator) {
    this.header = el.locator('.message-header');
    this.integrationBadge = this.header.locator('.integration-badge');
    this.body = new MessageBody(el);
    this.previews = new MessagePreviews(el);
    this.attachments = el.locator('.message-attachments .attachment');
    this.assetTiles = el.locator('.asset-tile');
    this.reactions = new MessageReactions(page, el);
    this.replyFooter = el.locator('.reply-footer');
    this.toolbar = new MessageToolbar(page, el);
    this.page = page;
    this.el = el;
    this.panel = panel;
  }

  getLinkLocator(name: string | RegExp) {
    return this.el.getByRole('link', { name });
  }

  async react(query: string) {
    await this.toolbar.reveal();
    await this.toolbar.reactBtn.click();
    await pickEmoji(this.page, query);
    return this.reactions.pills;
  }

  async openReplies() {
    await this.toolbar.reveal();
    await this.toolbar.replyBtn.click();
    const replies = new ThreadReplies(this.page);
    await expect(replies.el).toBeVisible();
    return replies;
  }

  async edit(text: string) {
    await this.toolbar.runAction('Edit message');
    await new MessageEditor(this.page, this.panel).save(text);
  }

  async remove() {
    await this.toolbar.runAction('Delete message');
  }
}
