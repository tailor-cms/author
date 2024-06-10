import { EndpointResponse, formatResponse } from './common';
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

  seedTestRepository = async (opts = {}): Promise<EndpointResponse> => {
    const req = await this.getClient();
    const res = await req.post(this.getUrl('repository'), opts);
    return formatResponse(res);
  };

  seedUser = async (): Promise<EndpointResponse> => {
    const req = await this.getClient();
    const res = await req.post(this.getUrl('user'));
    return formatResponse(res);
  };
}

export default new SeedClient();
