import type { Locator, Page } from '@playwright/test';

import { confirmAction } from '../common/utils';

export class Catalog {
  static route = '/';
  readonly page: Page;
  readonly loadMoreBtn: Locator;
  readonly searchInput: Locator;
  readonly orderByBtn: Locator;
  readonly orderDirectionBtn: Locator;
  readonly pinnedFilterBtn: Locator;
  readonly selectAllBtn: Locator;
  readonly selectionCount: Locator;
  readonly deleteSelectedBtn: Locator;
  readonly tagsFilterBtn: Locator;
  readonly schemaFilterBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.loadMoreBtn = page.getByRole('button', { name: 'Load more' });
    this.searchInput = page.getByLabel('Search repositories');
    this.pinnedFilterBtn = page.getByLabel('Toggle pinned items filter');
    // The bulk action bar toggle button flips between the two labels.
    this.selectAllBtn = page.getByRole('button', {
      name: /^(Select|Deselect) all$/,
    });
    this.selectionCount = page.locator('.selection-count');
    this.deleteSelectedBtn = page.getByRole('button', {
      name: 'Delete',
      exact: true,
    });
    this.orderByBtn = page.getByRole('button', { name: 'Order by' });
    this.orderDirectionBtn = page.getByRole('button', {
      name: 'Order direction',
    });
    this.tagsFilterBtn = page.getByRole('button', { name: 'Tags' });
    this.schemaFilterBtn = page.getByRole('button', { name: 'Schemas' });
  }

  visit() {
    return this.page.goto(Catalog.route);
  }

  loadMore() {
    return this.loadMoreBtn.click();
  }

  getRepositoryCards() {
    return this.page.locator('.repository-card');
  }

  getFirstRepositoryCard() {
    return this.getRepositoryCards().nth(0);
  }

  findRepositoryCard(hasText: string) {
    return this.getRepositoryCards().filter({ hasText });
  }

  async orderByProp(prop: 'Name' | 'Creation date') {
    await this.orderByBtn.click();
    await this.page
      .locator('.v-list-item-title')
      .filter({ hasText: prop })
      .click();
  }

  orderByName() {
    return this.orderByProp('Name');
  }

  orderByCreationDate() {
    return this.orderByProp('Creation date');
  }

  async filterByTag(tag: string) {
    await this.tagsFilterBtn.click();
    await this.page
      .locator('.v-list-item-title')
      .getByText(tag, { exact: true })
      .click();
  }

  async filterBySchema(schema: string) {
    await this.schemaFilterBtn.click();
    await this.page
      .locator('.v-list-item-title')
      .getByText(schema, { exact: true })
      .click();
  }

  getCardCheckboxes() {
    return this.getRepositoryCards()
      .getByRole('checkbox', { name: 'Select repository' });
  }

  getCardCheckbox(hasText: string) {
    return this.findRepositoryCard(hasText)
      .getByRole('checkbox', { name: 'Select repository' });
  }

  async toggleRepository(hasText: string) {
    await this.findRepositoryCard(hasText).hover();
    await this.getCardCheckbox(hasText).click();
  }

  async bulkDelete(...names: string[]) {
    for (const name of names) await this.toggleRepository(name);
    await this.deleteSelectedBtn.click();
    await confirmAction(this.page);
  }
}
