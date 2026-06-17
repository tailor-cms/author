import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { CollectionItem } from './CollectionItem';
import { CollectionItemEditor } from './CollectionItemEditor';
import { CreateItemDialog } from './CreateItemDialog';
import { EntityFilter } from './EntityFilter';

export class CollectionOutline {
  readonly page: Page;
  readonly el: Locator;
  readonly repositoryId: number;
  readonly entityFilter: EntityFilter;
  readonly searchInput: Locator;
  readonly sortBtn: Locator;
  readonly createBtn: Locator;
  readonly emptyAlert: Locator;
  readonly noMatchesAlert: Locator;

  constructor(page: Page, repositoryId: number) {
    this.page = page;
    this.el = page.locator('.structure-page');
    this.repositoryId = repositoryId;
    this.entityFilter = new EntityFilter(page);
    this.searchInput = this.el
      .locator('.toolbar')
      .getByPlaceholder('Search by name...');
    this.sortBtn = this.el.locator('.sort-btn');
    this.createBtn = this.el.getByTestId('repository__createActivityBtn');
    this.emptyAlert = this.el.getByText('Click the Create button above');
    this.noMatchesAlert = this.el.getByText('No matches found!');
  }

  async goto() {
    await this.page.goto(`/repository/${this.repositoryId}/root/structure`);
    await this.page.waitForLoadState('networkidle');
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

  // Pick the entity, open the Create dialog, fill the title and submit. The
  // collection Create flow drops the user into the editor, so this returns the
  // ready item editor.
  async createItem(entityLabel: string, title: string) {
    await this.entityFilter.select(entityLabel);
    await this.createBtn.click();
    const dialog = new CreateItemDialog(this.page);
    await dialog.create(title);
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
