import type { Locator, Page } from '@playwright/test';

export class WorkflowTable {
  readonly page: Page;
  readonly el: Locator;
  readonly emptyState: Locator;

  constructor(page: Page, root: Locator) {
    this.page = page;
    this.el = root.getByRole('table');
    this.emptyState = this.el.getByText('No data available');
  }

  items(name?: string) {
    return this.el.locator('tbody').getByRole('row', { name });
  }

  item(name: string) {
    return this.items(name);
  }

  // Click the name cell to select the row: the status/priority/assignee cells
  // are inline editors that intercept the click instead of opening the sidebar.
  open(name: string) {
    return this.item(name).getByText(name).click();
  }

  header(title: string) {
    return this.el.getByRole('columnheader', { name: title });
  }

  sortBy(title: string) {
    return this.header(title).click();
  }

  statusMenu(name: string) {
    return this.item(name).getByRole('button', { name: /^Status:/ });
  }

  priorityMenu(name: string) {
    return this.item(name).getByRole('button', { name: /^Priority:/ });
  }

  assigneeMenu(name: string) {
    return this.item(name).getByRole('button', { name: /^Assignee:/ });
  }

  private async pick(menu: Locator, option: string) {
    await menu.click();
    await this.page
      .locator('.v-overlay .v-list-item')
      .filter({ hasText: option })
      .click();
  }

  setStatus(name: string, status: string) {
    return this.pick(this.statusMenu(name), status);
  }

  setPriority(name: string, priority: string) {
    return this.pick(this.priorityMenu(name), priority);
  }

  setAssignee(name: string, assignee: string) {
    return this.pick(this.assigneeMenu(name), assignee);
  }
}
