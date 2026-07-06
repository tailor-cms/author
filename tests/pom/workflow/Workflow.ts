import { expect, type Locator, type Page } from '@playwright/test';

import { WorkflowBoard } from './Board';
import { WorkflowList } from './List';
import { WorkflowTable } from './Table';

export class Workflow {
  readonly page: Page;
  readonly el: Locator;
  readonly searchFilter: Locator;
  readonly statusFilter: Locator;
  readonly priorityFilter: Locator;
  readonly typeFilter: Locator;
  readonly assigneeFilter: Locator;
  readonly recentChip: Locator;
  readonly unpublishedChip: Locator;
  readonly boardViewBtn: Locator;
  readonly listViewBtn: Locator;
  readonly tableViewBtn: Locator;
  readonly board: WorkflowBoard;
  readonly list: WorkflowList;
  readonly table: WorkflowTable;

  constructor(page: Page) {
    this.page = page;
    this.el = page.locator('.workflow-page');
    this.searchFilter = this.el.getByPlaceholder('Search by name or id...');
    this.statusFilter = this.el.getByTestId('workflow_statusFilter');
    this.priorityFilter = this.el.getByTestId('workflow_priorityFilter');
    this.typeFilter = this.el.getByTestId('workflow_typeFilter');
    this.assigneeFilter = this.el.getByTestId('workflow_assigneeFilter');
    this.recentChip = this.el.getByRole('button', { name: 'Recent' });
    this.unpublishedChip = this.el.getByRole('button', { name: 'Unpublished' });
    this.boardViewBtn = this.el.getByRole('button', { name: 'Board view' });
    this.listViewBtn = this.el.getByRole('button', { name: 'List view' });
    this.tableViewBtn = this.el.getByRole('button', { name: 'Table view' });
    this.board = new WorkflowBoard(page, this.el);
    this.list = new WorkflowList(page, this.el);
    this.table = new WorkflowTable(page, this.el);
  }

  async showBoard() {
    await this.boardViewBtn.click();
    return this.board;
  }

  async showList() {
    await this.listViewBtn.click();
    return this.list;
  }

  async showTable() {
    await this.tableViewBtn.click();
    return this.table;
  }

  search(name: string) {
    return this.searchFilter.fill(name);
  }

  private async toggleChip(chip: Locator, option: string) {
    await chip.click();
    const item = this.page
      .locator('.v-overlay .v-list-item')
      .filter({ hasText: option });
    await item.click();
    await this.page.keyboard.press('Escape');
    await expect(item).toBeHidden();
  }

  filterStatus(status: string) {
    return this.toggleChip(this.statusFilter, status);
  }

  filterPriority(priority: string) {
    return this.toggleChip(this.priorityFilter, priority);
  }

  filterType(type: string) {
    return this.toggleChip(this.typeFilter, type);
  }

  filterAssignee(assignee: string) {
    return this.assigneeFilter.getByLabel(assignee).click();
  }

  toggleRecent() {
    return this.recentChip.click();
  }

  toggleUnpublished() {
    return this.unpublishedChip.click();
  }
}
