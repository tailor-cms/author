import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

import { MessageSearch } from './MessageSearch';
import { StartDiscussion } from './StartDiscussion';
import { Thread } from './Thread';
import { ThreadRail } from './ThreadRail';

export class Discussion {
  static getRoute = (repositoryId: number, threadId?: number) => {
    const route = `/repository/${repositoryId}/root/discussion`;
    return threadId ? `${route}?threadId=${threadId}` : route;
  };

  readonly page: Page;
  readonly el: Locator;
  readonly rail: ThreadRail;
  readonly thread: Thread;
  readonly search: MessageSearch;
  readonly startPanel: StartDiscussion;

  constructor(page: Page) {
    this.el = page.locator('.discussion-channel');
    this.rail = new ThreadRail(page);
    this.thread = new Thread(page);
    this.search = new MessageSearch(page);
    this.startPanel = new StartDiscussion(page);
    this.page = page;
  }

  static async visit(
    page: Page,
    repositoryId: number,
    options: { threadId?: number } = {},
  ) {
    const route = Discussion.getRoute(repositoryId, options.threadId);
    await page.goto(route, { waitUntil: 'networkidle' });
    return new Discussion(page);
  }

  /**
   * Visits the discussion and waits while it listens for live updates.
   */
  static async visitLive(page: Page, repositoryId: number) {
    const feed = `/api/repositories/${repositoryId}/feed`;
    const isListening = page.waitForRequest(
      (req) => req.method() === 'GET' && new URL(req.url()).pathname === feed,
    );
    const discussion = await Discussion.visit(page, repositoryId);
    await isListening;
    return discussion;
  }

  /**
   * Selects a thread in the rail. Selecting marks it read once its
   * messages load; pass `waitForSeen` when the test depends on that being
   * saved.
   */
  async selectThread(title: string, { waitForSeen = false } = {}) {
    const seen = waitForSeen
      ? this.page.waitForResponse((res) =>
          /\/threads\/\d+\/seen$/.test(res.url()),
        )
      : null;
    await this.rail.thread(title).first().click();
    await expect(this.thread.el).toBeVisible();
    await seen;
    return this.thread;
  }

  /**
   * Opens a new thread and names it, ready for its first message.
   */
  async openNewThread(title: string) {
    const { titleInput } = this.startPanel;
    await expect(async () => {
      await this.rail.newBtn.click();
      await titleInput.fill(title);
      await expect(titleInput).toHaveValue(title);
    }).toPass({ timeout: 15000 });
    return this.startPanel.composer;
  }

  async startThread(title: string, content: string) {
    const composer = await this.openNewThread(title);
    await composer.post(content);
  }
}
