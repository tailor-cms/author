import type { Locator, Page } from '@playwright/test';

import { dragBy } from '../../common/utils';
import { MessageComposer } from './MessageComposer';
import { ThreadMessage } from './ThreadMessage';

// Message replies panel within a discussion thread.
export class ThreadReplies {
  readonly page: Page;
  readonly el: Locator;
  readonly resizeHandle: Locator;
  readonly messages: Locator;
  // The message being replied to, listed first
  readonly parent: ThreadMessage;
  readonly composer: MessageComposer;
  readonly closeBtn: Locator;
  // Posts the reply to the thread as well
  readonly alsoSendToThreadCheckbox: Locator;

  constructor(page: Page) {
    const el = page.locator('.reply-panel');
    this.resizeHandle = page.locator('.reply-column > .resize-handle');
    this.messages = el.locator('.message-row');
    this.parent = new ThreadMessage(page, this.messages.first(), el);
    this.composer = new MessageComposer(page, el);
    this.closeBtn = el.getByRole('button', {
      name: 'Close replies',
      exact: true,
    });
    this.alsoSendToThreadCheckbox = el
      .locator('.broadcast-checkbox')
      .getByRole('checkbox');
    this.page = page;
    this.el = el;
  }

  getMessageLocator(text: string) {
    return this.messages.filter({ hasText: text });
  }

  getMessage(text: string) {
    return new ThreadMessage(this.page, this.getMessageLocator(text).first(), this.el);
  }

  resizeBy(deltaX: number) {
    return dragBy(this.page, this.resizeHandle, deltaX);
  }

  async width() {
    return (await this.el.boundingBox())!.width;
  }
}
