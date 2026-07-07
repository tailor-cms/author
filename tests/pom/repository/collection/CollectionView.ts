import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { CollectionItem } from './CollectionItem';
import { CollectionItemEditor } from './CollectionItemEditor';
import { CreateItemDialog } from './CreateItemDialog';
import { EntityFilter } from './EntityFilter';

// A collection entity
export interface Entity {
  label: string;
  titleLabel: string;
}

// The Items page
export class CollectionView {
  readonly page: Page;
  readonly el: Locator;
  readonly repositoryId: number;
  readonly entityFilter: EntityFilter;
  readonly searchInput: Locator;
  readonly sortBtn: Locator;
  readonly createBtn: Locator;
  readonly emptyAlert: Locator;
  readonly emptyCreateBtn: Locator;
  readonly emptyCopyBtn: Locator;
  readonly noMatchesAlert: Locator;

  constructor(page: Page, repositoryId: number) {
    this.page = page;
    this.el = page.locator('.structure-page');
    this.repositoryId = repositoryId;
    this.entityFilter = new EntityFilter(page);
    this.searchInput = this.el
      .locator('.toolbar')
      .getByPlaceholder('Search by name or id...');
    // The sort button's label changes with the active sort, so its stable hook
    // is the class rather than an accessible name.
    this.sortBtn = this.el.locator('.sort-btn');
    this.createBtn = this.el.getByRole('button', { name: 'Add', exact: true });
    this.emptyAlert = this.el.getByText('No items yet');
    this.emptyCreateBtn = this.el.getByTestId('repository__emptyCreate');
    this.emptyCopyBtn = this.el.getByTestId('repository__emptyCopy');
    this.noMatchesAlert = this.el.getByText('No matches found');
  }

  async goto() {
    await this.page.goto(`/repository/${this.repositoryId}/root/structure`, {
      waitUntil: 'networkidle',
    });
  }

  async getItems() {
    const rows = await this.el.locator(CollectionItem.selector).all();
    return rows.map((row) => new CollectionItem(this.page, row));
  }

  async getItemByName(name: string) {
    const row = this.el
      .locator(CollectionItem.selector)
      .filter({ hasText: name })
      .first();
    await expect(row).toBeVisible();
    return new CollectionItem(this.page, row);
  }

  // Pick the entity, open the Create dialog, fill the title and submit.
  async createItem(entity: Entity, title: string) {
    const isEmpty = await this.emptyAlert.isVisible();
    if (isEmpty) {
      await this.emptyCreateBtn.click();
      const dialog = new CreateItemDialog(this.page);
      await dialog.create(title, entity.titleLabel, entity.label);
    } else {
      await this.entityFilter.select(entity.label);
      await this.createBtn.click();
      await this.page.getByText('Create new', { exact: true }).click();
      const dialog = new CreateItemDialog(this.page);
      await dialog.create(title, entity.titleLabel);
    }
    return new CollectionItemEditor(this.page).waitReady();
  }

  search(term: string) {
    return this.searchInput.fill(term);
  }

  async sortBy(optionTitle: string) {
    await this.sortBtn.click();
    const option = this.page
      .locator('.v-overlay-container .v-list-item-title')
      .filter({ hasText: optionTitle });
    await option.click();
    // Wait for the menu overlay to close before the next interaction.
    await expect(option).toBeHidden();
  }

  async titles() {
    return this.el.locator('.collection-title').allInnerTexts();
  }
}
