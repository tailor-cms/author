import { outlineSeed } from '../helpers/seed';
import type { EndpointResponse } from './common';
import { formatResponse } from './common';
import BaseClient from './BaseClient';

class SeedClient extends BaseClient {
  constructor() {
    super('/api/seed/');
  }

  resetDatabase = async (): Promise<EndpointResponse> => {
    const req = await this.getClient();
    const res = await req.post(this.getUrl('reset'));
    return formatResponse(res);
  };

  seedCatalog = async (): Promise<EndpointResponse> => {
    const req = await this.getClient();
    const res = await req.post(this.getUrl('catalog'));
    return formatResponse(res);
  };

  seedTestRepository = async (data: any = {}): Promise<EndpointResponse> => {
    const req = await this.getClient();
    if (!data.schema) data.schema = outlineSeed.schema;
    const res = await req.post(this.getUrl('repository'), { data });
    return formatResponse(res);
  };

  seedUser = async (data = {}): Promise<EndpointResponse> => {
    const req = await this.getClient();
    const res = await req.post(this.getUrl('user'), { data });
    return formatResponse(res);
  };
}

export default new SeedClient();
