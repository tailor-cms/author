import type { Locator, Page } from '@playwright/test';

export class WorkflowList {
  readonly page: Page;
  readonly el: Locator;

  constructor(page: Page, root: Locator) {
    this.page = page;
    this.el = root.locator('.workflow-list');
  }

  items(name?: string) {
    const rows = this.el.locator('.list-item');
    return name ? rows.filter({ hasText: name }) : rows;
  }

  item(name: string) {
    return this.items(name);
  }

  open(name: string) {
    return this.item(name).click();
  }
}
