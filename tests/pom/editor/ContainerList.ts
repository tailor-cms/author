import { Locator, Page } from '@playwright/test';

import { Container } from './Container';

export class ContainerList {
  readonly page: Page;
  readonly el: Locator;
  readonly addBtn: Locator;

  constructor(page: Page) {
    const el = page.locator('.content-containers');
    this.addBtn = el.getByRole('button', { name: 'Create section' });
    this.el = el;
    this.page = page;
  }

  async getContainers(content?: string) {
    const locator = this.el.locator('.content-container');
    const items = await (content
      ? locator.filter({ hasText: content }).all()
      : locator.all());
    return items.map((item) => new Container(this.page, item));
  }

  addContainer() {
    return this.addBtn.click();
  }
}
