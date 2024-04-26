import { test } from '@playwright/test';
import userSeed from 'tailor-seed/user.json';

import { EndpointClient, getEndpointClient } from '../../api/client';
import { repositories as mockRepositories } from '../../fixtures/repositories';
import { percySnapshot } from '../../utils/percy.ts';
import { SignIn } from './../../pom/auth';

const DEFAULT_USER = userSeed[0];
let REPOSITORY_API: EndpointClient;

const seedCatalog = async () => {
  return Promise.all(
    mockRepositories.map((it) => REPOSITORY_API.create(it as any)),
  );
};

const cleanupCatalog = async (repositories) => {
  for (const repository of repositories) {
    await REPOSITORY_API.remove(repository.id);
  }
};

test.beforeAll(async ({ baseURL }) => {
  if (!baseURL) throw new Error('baseURL is required');
  REPOSITORY_API = await getEndpointClient(baseURL, '/api/repositories/');
});

test.beforeEach(async ({ page }) => {
  const { data } = await REPOSITORY_API.list();
  const { items: repositories } = data;
  if (repositories.length) await cleanupCatalog(repositories);
  const signInPage = new SignIn(page);
  await signInPage.visit();
  await signInPage.signIn(DEFAULT_USER.email, DEFAULT_USER.password);
  await page.goto('/', { waitUntil: 'networkidle' });
});

test('Should take a snapshot of an empty catalog', async ({ page }) => {
  await percySnapshot(page, 'Empty catalog page');
});

test('Should take a snapshot of an seeded catalog', async ({ page }) => {
  await seedCatalog();
  await page.reload({ waitUntil: 'networkidle' });
  await percySnapshot(page, 'Seeded catalog page');
});
