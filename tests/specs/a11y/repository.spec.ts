import { expect } from '@playwright/test';

import {
  outlineLevel,
  outlineSeed,
  toEmptyRepository,
  toSeededRepository,
} from '../../helpers/seed';
import { ActivityOutline } from '../../pom/repository/Outline.ts';
import { Discussion } from '../../pom/repository/discussion/Discussion.ts';
import { NavigationRail } from '../../pom/repository/NavigationRail.ts';
import { Workflow } from '../../pom/workflow/Workflow.ts';
import SeedClient from '../../api/SeedClient';
import { analyzePageWithAxe } from './helpers/analyzePageWithAxe';
import { test } from './helpers/axe-config';

const REPOSITORY_NAME = 'a11y test imported repository';

test('a11y check of the repository structure page', async ({
  page,
  makeAxeBuilder,
}, testInfo) => {
  await toSeededRepository(page, REPOSITORY_NAME);
  await page.getByText(outlineSeed.group.title).isVisible();
  await analyzePageWithAxe(
    page,
    makeAxeBuilder,
    'a11y-respository-structure-report',
    testInfo,
  );
});

test('a11y check of the history page', async ({
  page,
  makeAxeBuilder,
}, testInfo) => {
  await toEmptyRepository(page, REPOSITORY_NAME);
  const outline = new ActivityOutline(page);
  await outline.addFirstItem(outlineLevel.GROUP, 'Module 1');
  await new NavigationRail(page).goToHistory();
  await expect(page.getByText('Created repository')).toBeVisible();
  await expect(page.getByText('Created Module 1 module')).toBeVisible();
  await analyzePageWithAxe(
    page,
    makeAxeBuilder,
    'a11y-history-page-report',
    testInfo,
  );
});

test('a11y check of the progress page', async ({
  page,
  makeAxeBuilder,
}, testInfo) => {
  await toEmptyRepository(page, REPOSITORY_NAME);
  const outline = new ActivityOutline(page);
  await outline.addFirstItem(outlineLevel.GROUP, 'Module 1');
  await new NavigationRail(page).goToProgress();
  await expect(new Workflow(page).board.item('Module 1')).toBeVisible();
  await analyzePageWithAxe(
    page,
    makeAxeBuilder,
    'a11y-progress-page-report',
    testInfo,
  );
});

test('a11y check of the settings page', async ({
  page,
  makeAxeBuilder,
}, testInfo) => {
  await toSeededRepository(page, REPOSITORY_NAME);
  await new NavigationRail(page).goToSettings();
  await page.waitForLoadState('networkidle');
  await analyzePageWithAxe(
    page,
    makeAxeBuilder,
    'a11y-settings-page-report',
    testInfo,
  );
});

test('a11y check of the discussion page', async ({
  page,
  makeAxeBuilder,
}, testInfo) => {
  const { data } = await SeedClient.seedTestRepository({
    name: REPOSITORY_NAME,
  });
  const { id: activityId, repositoryId, data: activityData } = data.activity;
  await SeedClient.seedComment({
    repositoryId,
    activityId,
    contentElementId: data.contentElement.id,
    content: 'Needs a clearer example here',
  });
  const discussion = await Discussion.visit(page, repositoryId);
  const thread = await discussion.selectThread(activityData.name);
  await thread.expectMessage('Needs a clearer example here');
  await analyzePageWithAxe(
    page,
    makeAxeBuilder,
    'a11y-discussion-page-report',
    testInfo,
  );
});

test.afterAll(async () => {
  await SeedClient.resetDatabase();
});
