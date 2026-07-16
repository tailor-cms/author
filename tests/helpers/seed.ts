import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { faker } from '@faker-js/faker';

import ApiClient from '../api/ApiClient';
import SeedClient from '../api/SeedClient';

const REPOSITORY_API = new ApiClient('/api/repositories/');
const USER_GROUP_API = new ApiClient('/api/user-group/');

// Creates a workspace (user group) via the REST API; returns the new group.
export const createUserGroup = async (
  name: string,
): Promise<{ id: number; name: string }> => {
  const { data } = await USER_GROUP_API.create({ name } as any);
  return data;
};

// Deletes a workspace (user group) via the REST API.
export const deleteUserGroup = (id: number) => USER_GROUP_API.remove(id);

// Grants (or updates) a repository role for the given user
export const addRepositoryMember = async (
  repositoryId: number,
  email: string,
  role: 'ADMIN' | 'AUTHOR',
) => {
  const { status, data } = await REPOSITORY_API.post(
    `${repositoryId}/users`,
    { email, role },
  );
  expect(status).toBe(200);
  return data;
};

export const createCleanRepository = async (
  name?: string,
  userGroupIds?: number[],
) => {
  const payload = {
    schema: outlineSeed.schema,
    name: name || `Test ${new Date().getTime()}-${faker.string.alphanumeric(6)}`,
    description: faker.lorem.words(4),
    userGroupIds,
  };
  const { data: repository } = await REPOSITORY_API.create(payload as any);
  return repository;
};

// createCleanRepository + navigate to its (empty) structure page.
export const toEmptyRepository = async (
  page: Page,
  name?: string,
  userGroupIds?: number[],
) => {
  const repository = await createCleanRepository(name, userGroupIds);
  await page.goto(`/repository/${repository.id}/root/structure`);
  await page.waitForLoadState('networkidle');
  return repository;
};

export const toSeededRepository = async (
  page: Page,
  name?: string,
  authorEmail?: string,
) => {
  const { data } = await SeedClient.seedTestRepository({ name, authorEmail });
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

export const toRepositoryAssets = async (page: Page, name?: string) => {
  const { data } = await SeedClient.seedTestRepository({ name });
  const { repository } = data;
  await page.goto(`/repository/${repository.id}/root/assets`);
  await page.waitForLoadState('networkidle');
  return repository;
};

export const toSeededRepositorySettings = async (
  page: Page,
  authorEmail?: string,
) => {
  const { data } = await SeedClient.seedTestRepository({ authorEmail });
  const { repository, activity } = data;
  await page.goto(`/repository/${repository.id}/root/settings/general`);
  return { repository, activity };
};

export const toEmptyCollection = async (page: Page, name?: string) => {
  const payload = {
    schema: collectionSeed.schema,
    name: name || `${faker.lorem.words(2)} ${new Date().getTime()}`,
    description: faker.lorem.words(4),
  };
  const { data: repository } = await REPOSITORY_API.create(payload as any);
  await page.goto(`/repository/${repository.id}/root/structure`);
  await page.waitForLoadState('networkidle');
  return repository;
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

export const collectionSeed = {
  schema: 'TEST_COLLECTION',
  entities: {
    ARTICLE: {
      type: 'TEST_COLLECTION/ARTICLE',
      label: 'Article',
      titleLabel: 'Title',
    },
    AUTHOR: {
      type: 'TEST_COLLECTION/AUTHOR',
      label: 'Author',
      titleLabel: 'Full name',
    },
    TAG: { type: 'TEST_COLLECTION/TAG', label: 'Tag', titleLabel: 'Name' },
    CATEGORY: {
      type: 'TEST_COLLECTION/CATEGORY',
      label: 'Category',
      titleLabel: 'Name',
    },
  },
};

export const seedLinkedRepositories = async () => {
  const { data } = await SeedClient.seedTestRepository({
    includeLinkExample: true,
  });
  return data;
};

export const outlineLevel = {
  GROUP: 'Module',
  LEAF: 'Page',
};
