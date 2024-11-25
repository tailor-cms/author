import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

import { ActivityComments } from '../common/Comments';

export class WorkflowSidebar {
  readonly page: Page;
  readonly el: Locator;
  readonly descriptionInput: Locator;
  readonly statusInput: Locator;
  readonly assigneeInput: Locator;
  readonly priorityInput: Locator;
  readonly dueDateInput: Locator;
  readonly comments: ActivityComments;

  constructor(page: Page) {
    this.page = page;
    this.el = page.locator('.workflow-page .v-navigation-drawer');
    this.descriptionInput = this.el
      .getByTestId('workflow_descriptionInput')
      .getByRole('textbox');
    this.statusInput = this.el.getByTestId('workflow_statusInput');
    this.assigneeInput = this.el.getByTestId('workflow_assigneeInput');
    this.priorityInput = this.el.getByTestId('workflow_priorityInput');
    this.dueDateInput = this.el.getByTestId('workflow_dateInput');
    this.comments = new ActivityComments(page, this.el);
  }

  async setDescription(description: string) {
    await this.descriptionInput.fill(description);
  }

  async selectStatus(status: string) {
    await this.statusInput.click();
    const menuItem = this.page
      .locator('.v-list-item-title')
      .filter({ hasText: status });
    await menuItem.click();
    await expect(menuItem).not.toBeVisible();
  }

  async selectAssignee(assigneee: string) {
    await this.assigneeInput.click();
    const menuItem = this.page
      .locator('.v-list-item-title')
      .filter({ hasText: assigneee });
    await menuItem.click();
    await expect(menuItem).not.toBeVisible();
  }

  async selectPriority(priority: string) {
    await this.priorityInput.click();
    const menuItem = this.page
      .locator('.v-list-item-title')
      .filter({ hasText: priority });
    await menuItem.click();
    await expect(menuItem).not.toBeVisible();
  }

  async selectDueDate(dueDate: string) {
    await this.dueDateInput
      .getByLabel('Due date', { exact: true })
      .fill(dueDate);
    await this.dueDateInput.click();
    await this.dueDateInput.press('Enter');
  }
}
