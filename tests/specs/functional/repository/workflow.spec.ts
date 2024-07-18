import { expect, test } from '@playwright/test';
import userSeed from 'tailor-seed/user.json';
import { formatDate as format } from 'date-fns/format';
import sample from 'lodash/sample';

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

const getWorkflowRoute = (id) => `/repository/${id}/root/workflow`;
const statuses = ['Todo', 'In progress', 'Review', 'Done'];
const priorities = ['Trivial', 'Low', 'Medium', 'High', 'Critical'];
const dateFormat = {
  input: 'yyyy-MM-dd',
  table: 'MMM d, yyyy',
};

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
  const status = sample(statuses);
  const priority = sample(priorities);
  const dueDate = new Date();
  const assignee = userSeed[0].email;
  await toSeededRepositoryWorkflow(page);
  const workflow = new Workflow(page);
  await workflow.openItemByName(name);
  const sidebar = new WorkflowSidebar(page);
  await expect(sidebar.el.getByText(name)).toBeVisible();
  await sidebar.selectStatus(status);
  await sidebar.selectAssignee(assignee);
  await sidebar.selectPriority(priority);
  await sidebar.selectDueDate(format(dueDate, dateFormat.input));
  await page.reload();
  await page.waitForLoadState('networkidle');
  const row = await workflow.getItemByName(name);
  await expect(row.getByText(status)).toBeVisible();
  await expect(row.getByText(priority)).toBeVisible();
  await expect(row.getByText(assignee)).toBeVisible();
  await expect(row.getByText(format(dueDate, dateFormat.table))).toBeVisible();
});

test.afterAll(async () => {
  await SeedClient.resetDatabase();
});
