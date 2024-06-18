import * as Playwright from '@playwright/test';

import { TEST_USER } from '../fixtures/auth';

export default class BaseClient {
  private baseURL: string;
  private endpointURL: URL;
  private static req: Playwright.APIRequestContext;
  private static initialize: Promise<void>;

  constructor(endpointPath: string) {
    if (!process.env.APP_URL) throw new Error('APP_URL is not set!');
    this.baseURL = process.env.APP_URL;
    this.endpointURL = new URL(endpointPath, this.baseURL);
    BaseClient.initialize = this.signIn();
  }

  getUrl = (path: string = '') => new URL(path, this.endpointURL).toString();

  getClient = async () => {
    await BaseClient.initialize;
    return BaseClient.req;
  };

  private signIn = async () => {
    const { email, password } = TEST_USER;
    BaseClient.req = await Playwright.request.newContext();
    await BaseClient.req.post(new URL('/api/users/login', this.baseURL).href, {
      headers: { 'Content-Type': 'application/json' },
      data: { email, password },
    });
  };
}
