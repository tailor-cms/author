import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

export class ActivityPager {
  readonly page: Page;
  readonly previousCard: Locator;
  readonly nextCard: Locator;

  constructor(page: Page) {
    this.page = page;
    this.previousCard = page.getByTestId('editor-pager-previous');
    this.nextCard = page.getByTestId('editor-pager-next');
  }

  async toPrevious() {
    await this.previousCard.click();
  }

  async toNext() {
    await this.nextCard.click();
  }

  async expectNeighbours({ previous, next }: {
    previous: string;
    next: string;
  }) {
    await expect(this.previousCard).toContainText(previous);
    await expect(this.nextCard).toContainText(next);
  }

  async expectHidden() {
    await expect(this.previousCard).toHaveCount(0);
    await expect(this.nextCard).toHaveCount(0);
  }
}
