import * as Playwright from '@playwright/test';

import type { EndpointResponse } from './common';
import { formatResponse } from './common';
import BaseClient from './BaseClient';

export default class APIClient extends BaseClient {
  private createdEntityIds: number[];

  constructor(basePath: string) {
    super(basePath);
    this.createdEntityIds = [];
  }

  getEntityUrl = (id: number) => this.getUrl(id.toString());

  list = async (): Promise<EndpointResponse> => {
    const req = await this.getClient();
    const res = await req.get(this.getUrl());
    return formatResponse(res);
  };

  get = async (id: number): Promise<EndpointResponse> => {
    const req = await this.getClient();
    const res = await req.get(this.getEntityUrl(id));
    return formatResponse(res);
  };

  create = async (data: Map<string, any>): Promise<EndpointResponse> => {
    const req = await this.getClient();
    const res = await req.post(this.getUrl(), { data });
    const formattedResponse = await formatResponse(res);
    Playwright.expect([200, 201]).toContain(formattedResponse.status);
    if (formattedResponse?.data?.id)
      this.createdEntityIds.push(formattedResponse?.data?.id);
    return formattedResponse;
  };

  update = async (
    id: number,
    data: Map<string, any>,
  ): Promise<EndpointResponse> => {
    const req = await this.getClient();
    const res = await req.patch(this.getEntityUrl(id), { data });
    return formatResponse(res);
  };

  remove = async (id: number): Promise<EndpointResponse> => {
    const req = await this.getClient();
    const res = await req.delete(this.getEntityUrl(id));
    const formattedResponse = await formatResponse(res);
    Playwright.expect(formattedResponse.data).toBe(null);
    Playwright.expect(formattedResponse.status).toBe(204);
    this.createdEntityIds.splice(this.createdEntityIds.indexOf(id), 1);
    return formattedResponse;
  };

  dispose = async (): Promise<void> => {
    const req = await this.getClient();
    await Promise.all(
      this.createdEntityIds.map(async (id) =>
        req.delete(this.getEntityUrl(id)),
      ),
    );
  };
}
