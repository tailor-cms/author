import { expect, test } from '@playwright/test';
import { faker } from '@faker-js/faker';
import { formatDate as format } from 'date-fns/format';
import { sample } from 'lodash-es';
import userSeed from 'tailor-seed/user.json' with { type: 'json' };

import {
  outlineSeed,
  toEmptyRepository,
  toSeededRepositoryWorkflow,
} from '../../../helpers/seed';
import SeedClient from '../../../api/SeedClient';
import { Workflow } from '../../../pom/workflow/Workflow';
import { WorkflowSidebar } from '../../../pom/workflow/Sidebar';

const statuses = ['Todo', 'In progress', 'Review', 'Done'];
const priorities = ['Trivial', 'Low', 'Medium', 'High', 'Critical'];
const dateFormat = {
  input: 'MM/dd/yyyy',
  table: 'MMM d, yyyy',
};

const getWorkflowRoute = (id: number) => `/repository/${id}/root/workflow`;

test.beforeEach(async () => {
  await SeedClient.resetDatabase();
});

test('should display no items for empty repository', async ({ page }) => {
  const repository = await toEmptyRepository(page);
  await page.goto(getWorkflowRoute(repository.id));
  const workflow = new Workflow(page);
  await expect(workflow.emptyState).toBeVisible();
});

test.describe('with a seeded workflow', () => {
  test.beforeEach(async ({ page }) => {
    await toSeededRepositoryWorkflow(page);
  });

  test('should render the item in every view', async ({ page }) => {
    const name = outlineSeed.group.title;
    const workflow = new Workflow(page);
    await expect(workflow.board.item(name)).toBeVisible();
    const list = await workflow.showList();
    await expect(list.item(name)).toBeVisible();
    const table = await workflow.showTable();
    await expect(table.item(name)).toBeVisible();
  });

  // The table view is the canonical surface for data assertions - every field
  // is a text column and filtering drops rows - so these pin to it.
  test.describe('data operations', () => {
    test('should open the sidebar for an item', async ({ page }) => {
      const name = outlineSeed.group.title;
      const workflow = new Workflow(page);
      const table = await workflow.showTable();
      await table.open(name);
      const sidebar = new WorkflowSidebar(page);
      await expect(sidebar.el.getByText(name)).toBeVisible();
    });

    test('should update an item', async ({ page }) => {
      const name = outlineSeed.group.title;
      const description = faker.lorem.sentence();
      const status = sample(statuses)!;
      const priority = sample(priorities)!;
      const dueDate = new Date();
      const assignee = userSeed[0].email;
      const workflow = new Workflow(page);
      const table = await workflow.showTable();
      await table.open(name);
      const sidebar = new WorkflowSidebar(page);
      await expect(sidebar.el.getByText(name)).toBeVisible();
      await sidebar.setDescription(description);
      await sidebar.selectStatus(status);
      await sidebar.selectAssignee(assignee);
      await sidebar.selectPriority(priority);
      await sidebar.selectDueDate(format(dueDate, dateFormat.input));
      // Every edited field surfaces as a column in the current (table) view.
      const row = table.item(name);
      await expect(row.getByText(status)).toBeVisible();
      await expect(row.getByText(priority)).toBeVisible();
      await expect(row.getByText(assignee)).toBeVisible();
      const dueDateText = format(dueDate, dateFormat.table);
      await expect(row.getByText(dueDateText)).toBeVisible();
      // Reload the page to check if the changes are persisted
      await page.reload();
      await expect(
        sidebar.descriptionInput.getByText(description),
      ).toBeVisible();
      await expect(sidebar.statusInput.getByText(status)).toBeVisible();
      await expect(sidebar.priorityInput.getByText(priority)).toBeVisible();
      await expect(sidebar.assigneeInput.getByText(assignee)).toBeVisible();
      await expect(sidebar.dueDateInput.locator('input')).toHaveValue(
        format(dueDate, dateFormat.input),
      );
    });

    test('should filter by name', async ({ page }) => {
      const name = outlineSeed.group.title;
      const workflow = new Workflow(page);
      const table = await workflow.showTable();
      await workflow.search(name);
      await expect(table.items()).toHaveCount(1);
    });

    test('should filter by status', async ({ page }) => {
      const name = outlineSeed.group.title;
      const workflow = new Workflow(page);
      const table = await workflow.showTable();
      await table.open(name);
      const sidebar = new WorkflowSidebar(page);
      await expect(sidebar.el.getByText(name)).toBeVisible();
      await sidebar.selectStatus('Done');
      await workflow.filterStatus('Done');
      await expect(table.items()).toHaveCount(1);
    });

    test('should filter by assignee', async ({ page }) => {
      const assignee = userSeed[0].email;
      const name = outlineSeed.group.title;
      const workflow = new Workflow(page);
      const table = await workflow.showTable();
      await table.open(name);
      const sidebar = new WorkflowSidebar(page);
      await expect(sidebar.el.getByText(name)).toBeVisible();
      await sidebar.selectAssignee(assignee);
      await workflow.filterAssignee(assignee);
      await expect(table.items()).toHaveCount(1);
    });

    test('should filter by priority', async ({ page }) => {
      const name = outlineSeed.group.title;
      const workflow = new Workflow(page);
      const table = await workflow.showTable();
      await table.open(name);
      const sidebar = new WorkflowSidebar(page);
      await expect(sidebar.el.getByText(name)).toBeVisible();
      await sidebar.selectPriority('Critical');
      await workflow.filterPriority('Critical');
      await expect(table.items()).toHaveCount(1);
    });

    test('should filter by multiple statuses', async ({ page }) => {
      const group = outlineSeed.group.title;
      const entry = outlineSeed.primaryPage.title;
      const workflow = new Workflow(page);
      const table = await workflow.showTable();
      const sidebar = new WorkflowSidebar(page);
      // Give two items distinct statuses; the third keeps its default.
      await table.open(group);
      await sidebar.selectStatus('Done');
      await table.open(entry);
      await sidebar.selectStatus('Review');
      // Selecting both statuses shows their union, excluding the rest.
      await workflow.filterStatus('Done');
      await workflow.filterStatus('Review');
      await expect(table.items()).toHaveCount(2);
    });

    test('should change status inline on a row', async ({ page }) => {
      const name = outlineSeed.group.title;
      const workflow = new Workflow(page);
      const table = await workflow.showTable();
      await table.setStatus(name, 'Done');
      await expect(table.statusMenu(name)).toContainText('Done');
      // Reload to confirm the inline edit persisted
      await page.reload();
      await expect(table.statusMenu(name)).toContainText('Done');
    });

    test('should change priority inline on a row', async ({ page }) => {
      const name = outlineSeed.group.title;
      const workflow = new Workflow(page);
      const table = await workflow.showTable();
      await table.setPriority(name, 'Critical');
      await expect(table.priorityMenu(name)).toContainText('Critical');
      await page.reload();
      await expect(table.priorityMenu(name)).toContainText('Critical');
    });

    test('should change assignee inline on a row', async ({ page }) => {
      const name = outlineSeed.group.title;
      const assignee = userSeed[0].email;
      const workflow = new Workflow(page);
      const table = await workflow.showTable();
      await table.setAssignee(name, assignee);
      await expect(table.assigneeMenu(name)).toContainText(assignee);
      await page.reload();
      await expect(table.assigneeMenu(name)).toContainText(assignee);
    });

    test('should change due date inline on a row', async ({ page }) => {
      const name = outlineSeed.group.title;
      const dueDate = new Date();
      dueDate.setDate(15);
      const expected = format(dueDate, dateFormat.table);
      const workflow = new Workflow(page);
      const table = await workflow.showTable();
      await table.setDueDate(name, '15');
      await expect(table.dueDateMenu(name)).toContainText(expected);
      await page.reload();
      await expect(table.dueDateMenu(name)).toContainText(expected);
    });

    test('should post a comment', async ({ page }) => {
      const name = outlineSeed.group.title;
      const workflow = new Workflow(page);
      const table = await workflow.showTable();
      await table.open(name);
      const sidebar = new WorkflowSidebar(page);
      await expect(sidebar.el.getByText(name)).toBeVisible();
      const comment = faker.lorem.sentence();
      await sidebar.comments.post(comment);
      await expect(sidebar.comments.thread).toContainText(comment);
    });
  });

  test.describe('board view', () => {
    test('status filter focuses a single column', async ({ page }) => {
      const workflow = new Workflow(page);
      await expect(workflow.board.columns).toHaveCount(statuses.length);
      await workflow.filterStatus('Todo');
      await expect(workflow.board.columns).toHaveCount(1);
      await expect(workflow.board.column('Todo')).toBeVisible();
    });

    test('drag moves a card to another status', async ({ page }) => {
      const name = outlineSeed.group.title;
      const workflow = new Workflow(page);
      await workflow.board.moveToColumn(name, 'Done');
      const moved = workflow.board.cardsInColumn('Done').filter({ hasText: name });
      await expect(moved).toBeVisible();
    });
  });
});

test.afterAll(async () => {
  await SeedClient.resetDatabase();
});
