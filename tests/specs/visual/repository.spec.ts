import { expect, test } from '@playwright/test';

import {
  outlineLevel,
  outlineSeed,
  toEmptyRepository,
  toSeededRepository,
  toSeededRepositoryWorkflow,
} from '../../helpers/seed';
import { ActivityOutline } from '../../pom/repository/Outline.ts';
import { NavigationRail } from '../../pom/repository/NavigationRail.ts';
import { Workflow } from '../../pom/workflow/Workflow.ts';
import { percySnapshot } from '../../utils/percy.ts';
import SeedClient from '../../api/SeedClient';

const REPOSITORY_NAME = 'Visual test imported repository';

test('Take a snapshot of the repository structure page', async ({ page }) => {
  await toSeededRepository(page, REPOSITORY_NAME);
  await page.getByText(outlineSeed.group.title).isVisible();
  await percySnapshot(page, 'Repository structure page');
});

test('Take a snapshot of the history page', async ({ page }) => {
  await toEmptyRepository(page, REPOSITORY_NAME);
  const outline = new ActivityOutline(page);
  await outline.addRootItem(outlineLevel.GROUP, 'Module 1');
  await new NavigationRail(page).goToHistory();
  await expect(page.getByText('Created repository')).toBeVisible();
  await expect(page.getByText('Created Module 1 module')).toBeVisible();
  await percySnapshot(page, 'Repository history page');
});

test('Take a snapshot of the progress views', async ({ page }) => {
  await toSeededRepositoryWorkflow(page, REPOSITORY_NAME);
  const workflow = new Workflow(page);
  const name = outlineSeed.group.title;

  const board = await workflow.showBoard();
  await expect(board.item(name)).toBeVisible();
  await percySnapshot(page, 'Repository progress page - board');

  const list = await workflow.showList();
  await expect(list.item(name)).toBeVisible();
  await percySnapshot(page, 'Repository progress page - list');

  const table = await workflow.showTable();
  await expect(table.item(name)).toBeVisible();
  await percySnapshot(page, 'Repository progress page - table');
});

test('Take a snapshot of the settings page', async ({ page }) => {
  await toSeededRepository(page, REPOSITORY_NAME);
  await new NavigationRail(page).goToSettings();
  await page.waitForLoadState('networkidle');
  await percySnapshot(page, 'Repository settings page');
});

test.afterAll(async () => {
  await SeedClient.resetDatabase();
});
