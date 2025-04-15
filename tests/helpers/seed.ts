import { faker } from '@faker-js/faker';
import type { Page } from '@playwright/test';

import ApiClient from '../api/ApiClient';
import SeedClient from '../api/SeedClient';

const REPOSITORY_API = new ApiClient('/api/repositories/');

export const toEmptyRepository = async (
  page: Page,
  name?: string,
  userGroupIds?: number[],
) => {
  const payload = {
    schema: outlineSeed.schema,
    name: name || `${faker.lorem.words(2)} ${new Date().getTime()}`,
    description: faker.lorem.words(4),
    userGroupIds,
  };
  const { data: repository } = await REPOSITORY_API.create(payload as any);
  await page.goto(`/repository/${repository.id}/root/structure`);
  await page.waitForLoadState('networkidle');
  return repository;
};

export const toSeededRepository = async (
  page: Page,
  name?: string,
  userEmail?: string,
) => {
  const { data } = await SeedClient.seedTestRepository({ name, userEmail });
  const { repository, activity } = data;
  await page.goto(`/repository/${repository.id}/root/structure`);
  return { repository, activity };
};

export const toSeededRepositoryWorkflow = async (page: Page, name?: string) => {
  const { data } = await SeedClient.seedTestRepository({ name });
  const { repository } = data;
  await page.goto(`/repository/${repository.id}/root/workflow`);
  return repository;
};

export const toSeededRepositorySettings = async (
  page: Page,
  userEmail?: string,
) => {
  const { data } = await SeedClient.seedTestRepository({ userEmail });
  const { repository, activity } = data;
  await page.goto(`/repository/${repository.id}/root/settings/general`);
  return { repository, activity };
};

export const outlineSeed = {
  schema: 'COURSE_SCHEMA',
  group: {
    title: 'Introduction to Pizza Making',
  },
  primaryPage: {
    title: 'History of Pizza',
    textContent: 'The story of pizza begins in antiquity',
  },
  secondaryPage: {
    title: 'Different Pizza Styles Around the World',
    textContent: 'Click the button below to add content',
  },
};

export const outlineLevel = {
  GROUP: 'Module',
  LEAF: 'Page',
};
