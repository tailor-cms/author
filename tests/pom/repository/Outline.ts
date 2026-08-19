import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

import { AddItemDialog } from './AddItemDialog';
import { CopyActivityDialog } from './CopyActivityDialog';
import { LinkContentDialog } from './LinkContentDialog';
import { OutlineItem } from './OutlineItem';
import { OutlineSidebar } from './OutlineSidebar';

export class ActivityOutline {
  static getRoute = (repositoryId: number) =>
    `/repository/${repositoryId}/root/structure`;

  readonly page: Page;
  readonly el: Locator;
  readonly searchInput: Locator;
  readonly items: Locator;
  readonly toggleAllBtn: Locator;
  readonly addMenuBtn: Locator;
  readonly emptyCreateCard: Locator;
  readonly emptyCopyCard: Locator;
  readonly emptyLinkCard: Locator;

  constructor(page: Page) {
    const el = page.locator('.structure-page');
    this.searchInput = el.getByPlaceholder('Search by name or id...');
    this.items = el.locator('.activity-wrapper');
    this.toggleAllBtn = el.getByRole('button', {
      name: /^(Expand all|Collapse all)$/,
    });
    this.addMenuBtn = el.getByRole('button', { name: 'Add', exact: true });
    this.emptyCreateCard = el.getByTestId('repository__emptyCreate');
    this.emptyCopyCard = el.getByTestId('repository__emptyCopy');
    this.emptyLinkCard = el.getByTestId('repository__emptyLink');
    this.page = page;
    this.el = el;
  }

  toggleExpand() {
    return this.toggleAllBtn.click();
  }

  search(name: string) {
    return this.searchInput.fill(name);
  }

  expectLastItem(uid: string) {
    const lastItem = this.items.last().locator('.activity');
    return expect(lastItem).toHaveAttribute('id', `activity_${uid}`);
  }

  async getOutlineItemByName(name: string) {
    const item = this.el.locator('.activity').filter({ hasText: name }).first();
    await expect(item).toBeVisible();
    return new OutlineItem(this.page, item);
  }

  async getOutlineItemByUid(uid: string) {
    const item = this.el.locator(`#activity_${uid}`);
    await expect(item).toBeVisible();
    return new OutlineItem(this.page, item);
  }

  async selectItem(uid: string) {
    const item = await this.getOutlineItemByUid(uid);
    await item.select();
    const sidebar = new OutlineSidebar(this.page);
    return { item, sidebar };
  }

  async expandAndSelect(uid: string) {
    await this.toggleExpand();
    return this.selectItem(uid);
  }

  async addRootItem(type: string, name: string) {
    await this.addMenuBtn.waitFor({ state: 'visible' });
    await this.addMenuBtn.click();
    await this.page.getByText('Create new', { exact: true }).click();
    const addActivityDialog = new AddItemDialog(this.page);
    await addActivityDialog.create(type, name);
    return this.getOutlineItemByName(name);
  }

  async addFirstItem(type: string, name: string) {
    await this.emptyCreateCard.click();
    const addActivityDialog = new AddItemDialog(this.page);
    await addActivityDialog.create(type, name);
    return this.getOutlineItemByName(name);
  }

  async linkExisting() {
    await this.addMenuBtn.waitFor({ state: 'visible' });
    await this.addMenuBtn.click();
    await this.page.getByText('Link existing', { exact: true }).click();
    return new LinkContentDialog(this.page);
  }

  async linkFirst() {
    await this.emptyLinkCard.click();
    return new LinkContentDialog(this.page);
  }

  async copyExisting() {
    await this.addMenuBtn.waitFor({ state: 'visible' });
    await this.addMenuBtn.click();
    await this.page.getByText('Copy existing', { exact: true }).click();
    return new CopyActivityDialog(this.page);
  }

  async copyFirst() {
    await this.emptyCopyCard.click();
    return new CopyActivityDialog(this.page);
  }
}
