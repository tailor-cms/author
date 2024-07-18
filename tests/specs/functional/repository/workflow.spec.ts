import { expect, test } from '@playwright/test';
import { faker } from '@faker-js/faker';
import { formatDate as format } from 'date-fns/format';
import sample from 'lodash/sample';
import userSeed from 'tailor-seed/user.json';

import {
  outlineLevel,
  outlineSeed,
  toEmptyRepository,
  toSeededRepositoryWorkflow,
} from '../../../helpers/seed';
import { ActivityOutline } from '../../../pom/repository/Outline';
import SeedClient from '../../../api/SeedClient';
import { Workflow } from '../../../pom/workflow/Workflow';
import { WorkflowSidebar } from '../../../pom/workflow/Sidebar';

const statuses = ['Todo', 'In progress', 'Review', 'Done'];
const priorities = ['Trivial', 'Low', 'Medium', 'High', 'Critical'];
const dateFormat = {
  input: 'MM/dd/yyyy',
  table: 'MMM d, yyyy',
};

const getWorkflowRoute = (id) => `/repository/${id}/root/workflow`;

test.beforeEach(async () => {
  await SeedClient.resetDatabase();
});

test('should display no data for empty repository', async ({ page }) => {
  const repository = await toEmptyRepository(page);
  await page.goto(getWorkflowRoute(repository.id));
  await expect(page.getByText('No data available')).toBeVisible();
});

test('should display activity entry in progress table', async ({ page }) => {
  const repository = await toEmptyRepository(page);
  const outline = new ActivityOutline(page);
  const groupName = 'Leaf 1';
  await outline.addRootItem(outlineLevel.LEAF, groupName);
  await page.goto(getWorkflowRoute(repository.id));
  await expect(page.getByText(groupName)).toBeVisible();
});

test('should be able to open sidebar for the workflow item', async ({
  page,
}) => {
  await toSeededRepositoryWorkflow(page);
  const groupTitle = outlineSeed.group.title;
  const workflow = new Workflow(page);
  await workflow.openItemByName(groupTitle);
  const sidebar = new WorkflowSidebar(page);
  await expect(sidebar.el.getByText(groupTitle)).toBeVisible();
});

test('should be able to update workflow item', async ({ page }) => {
  const name = outlineSeed.group.title;
  const description = faker.lorem.sentence();
  const status = sample(statuses);
  const priority = sample(priorities);
  const dueDate = new Date();
  const assignee = userSeed[0].email;
  await toSeededRepositoryWorkflow(page);
  const workflow = new Workflow(page);
  await workflow.openItemByName(name);
  const sidebar = new WorkflowSidebar(page);
  await expect(sidebar.el.getByText(name)).toBeVisible();
  const row = workflow.getRow(name);
  await sidebar.setDescription(description);
  await sidebar.selectStatus(status);
  await expect(row.getByText(status)).toBeVisible();
  await sidebar.selectAssignee(assignee);
  await expect(row.getByText(assignee)).toBeVisible();
  await sidebar.selectPriority(priority);
  await expect(row.getByText(priority)).toBeVisible();
  await sidebar.selectDueDate(format(dueDate, dateFormat.input));
  await expect(row.getByText(format(dueDate, dateFormat.table))).toBeVisible();
  // Reload the page to check if the changes are persisted
  await page.reload();
  await expect(sidebar.descriptionInput.getByText(description)).toBeVisible();
  await expect(sidebar.statusInput.getByText(status)).toBeVisible();
  await expect(sidebar.priorityInput.getByText(priority)).toBeVisible();
  await expect(sidebar.assigneeInput.getByText(assignee)).toBeVisible();
  await expect(sidebar.dueDateInput.locator('input')).toHaveValue(
    format(dueDate, dateFormat.input),
  );
});

test('should be able to filter by name', async ({ page }) => {
  const name = outlineSeed.group.title;
  await toSeededRepositoryWorkflow(page);
  const workflow = new Workflow(page);
  await workflow.search(name);
  await expect(workflow.getRow()).toHaveCount(1);
});

test('should be able to filter by status', async ({ page }) => {
  const name = outlineSeed.group.title;
  await toSeededRepositoryWorkflow(page);
  const workflow = new Workflow(page);
  await workflow.openItemByName(name);
  const sidebar = new WorkflowSidebar(page);
  await expect(sidebar.el.getByText(name)).toBeVisible();
  await sidebar.selectStatus('Done');
  await workflow.filterStatus('Done');
  await expect(workflow.getRow()).toHaveCount(1);
});

test('should be able to filter by asignee', async ({ page }) => {
  const assignee = userSeed[0].email;
  const name = outlineSeed.group.title;
  await toSeededRepositoryWorkflow(page);
  const workflow = new Workflow(page);
  await workflow.openItemByName(name);
  const sidebar = new WorkflowSidebar(page);
  await expect(sidebar.el.getByText(name)).toBeVisible();
  await sidebar.selectAssignee(assignee);
  await workflow.filterAssignee(assignee);
  await expect(workflow.getRow()).toHaveCount(1);
});

test('should be able to post a comment', async ({ page }) => {
  await toSeededRepositoryWorkflow(page);
  const name = outlineSeed.group.title;
  const workflow = new Workflow(page);
  await workflow.openItemByName(name);
  const sidebar = new WorkflowSidebar(page);
  await expect(sidebar.el.getByText(name)).toBeVisible();
  const comment = faker.lorem.sentence();
  await sidebar.comments.post(comment);
  await expect(sidebar.comments.thread).toContainText(comment);
});

test.afterAll(async () => {
  await SeedClient.resetDatabase();
});
