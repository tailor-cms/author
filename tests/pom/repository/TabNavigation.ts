import type { Page } from '@playwright/test';

import { NavigationRail } from './NavigationRail';

export class TabNavigation {
  readonly page: Page;
  readonly rail: NavigationRail;
  readonly el;

  constructor(page: Page) {
    this.page = page;
    this.rail = new NavigationRail(page);
    this.el = this.rail.el;
  }

  goToHistory() {
    return this.rail.goToHistory();
  }

  goToProgress() {
    return this.rail.goToProgress();
  }

  goToSettings() {
    return this.rail.goToSettings();
  }
}
