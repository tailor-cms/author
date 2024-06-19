import { faker } from '@faker-js/faker';
import { Page } from '@playwright/test';

import ApiClient from '../api/ApiClient';
import SeedClient from '../api/SeedClient';

const REPOSITORY_API = new ApiClient('/api/repositories/');

export const toEmptyRepository = async (page: Page) => {
  const payload = {
    schema: 'COURSE_SCHEMA',
    name: `${faker.lorem.words(2)} ${new Date().getTime()}`,
    description: faker.lorem.words(4),
  };
  const { data: repository } = await REPOSITORY_API.create(payload as any);
  await page.goto(`/repository/${repository.id}/root/structure`);
  await page.waitForLoadState('networkidle');
  return repository;
};

export const toSeededRepository = async (page: Page) => {
  const { data } = await SeedClient.seedTestRepository();
  const { repository } = data;
  await page.goto(`/repository/${repository.id}/root/structure`);
  return repository;
};

export const toSeededRepositorySettings = async (page: Page) => {
  const { data } = await SeedClient.seedTestRepository();
  const { repository } = data;
  await page.goto(`/repository/${repository.id}/root/settings/general`);
  return repository;
};
