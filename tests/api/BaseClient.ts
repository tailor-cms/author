import * as Playwright from '@playwright/test';

import { ADMIN_TEST_USER } from '../fixtures/auth';
import type { EndpointResponse } from './common';
import { formatResponse } from './common';

export default class BaseClient {
  private baseURL: string;
  private endpointURL: URL;
  private static req: Playwright.APIRequestContext;
  private static initialize: Promise<void>;

  constructor(endpointPath: string) {
    if (!process.env.APP_URL) throw new Error('APP_URL is not set!');
    this.baseURL = process.env.APP_URL;
    this.endpointURL = new URL(endpointPath, this.baseURL);
    if (!BaseClient.initialize) {
      BaseClient.initialize = this.signIn();
    }
  }

  getUrl = (path: string = '') => new URL(path, this.endpointURL).toString();

  getClient = async () => {
    await BaseClient.initialize;
    return BaseClient.req;
  };

  get = async (path: string = ''): Promise<EndpointResponse> => {
    const req = await this.getClient();
    const res = await req.get(this.getUrl(path));
    return formatResponse(res);
  };

  post = async (
    path: string = '',
    data?: any,
  ): Promise<EndpointResponse> => {
    const req = await this.getClient();
    const res = await req.post(this.getUrl(path), { data });
    return formatResponse(res);
  };

  private signIn = async () => {
    const { email, password } = ADMIN_TEST_USER;
    BaseClient.req = await Playwright.request.newContext();
    await BaseClient.req.post(new URL('/api/users/login', this.baseURL).href, {
      headers: { 'Content-Type': 'application/json' },
      data: { email, password },
    });
  };
}
