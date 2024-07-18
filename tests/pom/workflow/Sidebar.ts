import { Locator, Page } from '@playwright/test';

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
    this.descriptionInput = this.el.getByText('Description');
    this.statusInput = this.el.getByTestId('status-input');
    this.assigneeInput = this.el.getByTestId('assignee-input');
    this.priorityInput = this.el.getByTestId('priority-input');
    this.dueDateInput = this.el.getByTestId('date-input');
    this.comments = new ActivityComments(page, this.el);
  }

  async selectStatus(status: string) {
    await this.statusInput.click();
    await this.page
      .locator('.v-list-item-title')
      .filter({ hasText: status })
      .click();
  }

  async selectAssignee(assigneee: string) {
    await this.assigneeInput.click();
    await this.page
      .locator('.v-list-item-title')
      .filter({ hasText: assigneee })
      .click();
  }

  async selectPriority(priority: string) {
    await this.priorityInput.click();
    await this.page
      .locator('.v-list-item-title')
      .filter({ hasText: priority })
      .click();
  }

  async selectDueDate(dueDate: string) {
    await this.dueDateInput
      .getByLabel('Due date', { exact: true })
      .fill(dueDate);
    await this.dueDateInput.click();
    await this.dueDateInput.press('Enter');
  }
}
