import * as Playwright from '@playwright/test';
import userSeed from 'tailor-seed/user.json';

import { EndpointResponse, formatResponse } from './common';

class SeedClient {
  private baseURL: string;
  private seedBaseURL: URL;
  private req: Playwright.APIRequestContext;
  private initialize: Promise<void>;

  constructor() {
    if (!process.env.APP_URL) throw new Error('APP_URL is not set!');
    this.baseURL = process.env.APP_URL;
    this.seedBaseURL = new URL('/api/seed/', this.baseURL);
    this.initialize = this.signIn();
  }

  private signIn = async () => {
    const { email, password } = userSeed[0];
    this.req = await Playwright.request.newContext();
    await this.req.post(new URL('/api/users/login', this.baseURL).href, {
      headers: { 'Content-Type': 'application/json' },
      data: { email, password },
    });
  };

  getUrl = (path: string) => new URL(path, this.seedBaseURL).toString();

  resetDatabase = async (): Promise<EndpointResponse> => {
    await this.initialize;
    const res = await this.req.post(this.getUrl('reset'));
    return formatResponse(res);
  };

  seedCatalog = async (): Promise<EndpointResponse> => {
    await this.initialize;
    const res = await this.req.post(this.getUrl('catalog'));
    return formatResponse(res);
  };

  seedTestRepository = async (): Promise<EndpointResponse> => {
    await this.initialize;
    const res = await this.req.post(this.getUrl('repository'));
    return formatResponse(res);
  };

  seedUser = async (): Promise<EndpointResponse> => {
    await this.initialize;
    const res = await this.req.post(this.getUrl('user'));
    return formatResponse(res);
  };
}

export default new SeedClient();
