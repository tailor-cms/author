import * as Playwright from '@playwright/test';
import userSeed from 'tailor-seed/user.json';

export interface EndpointResponse {
  status: number;
  data?: any;
}

export interface EndpointClient {
  req: Playwright.APIRequestContext;
  list: () => Promise<EndpointResponse>;
  get: (id: number) => Promise<EndpointResponse>;
  create: (data: Map<string, any>) => Promise<EndpointResponse>;
  update: (id: number, data: Map<string, any>) => Promise<EndpointResponse>;
  remove: (id: number) => Promise<EndpointResponse>;
  dispose: () => Promise<void>;
}

const formatResponse = async (
  res: Playwright.APIResponse,
): Promise<EndpointResponse> => {
  const body = (await res.text()) ? await res.json() : null;
  return { status: res.status(), data: body?.data || body };
};

export const getEndpointClient = async (
  baseUrl: string,
  endpointPath: string,
): Promise<EndpointClient> => {
  const ENDPOINT_URL = new URL(endpointPath, baseUrl);
  const req = await Playwright.request.newContext();
  const defaultUser = userSeed[0];

  // Login as admin user, default seed user data
  await req.post(new URL('/api/users/login', baseUrl).href, {
    headers: { 'Content-Type': 'application/json' },
    data: { email: defaultUser.email, password: defaultUser.password },
  });

  // Store created entity ids for clean up later; see dispose() method
  const createdEntityIds: number[] = [];
  const getEntityUrl = (id) => new URL(id.toString(), ENDPOINT_URL).toString();

  async function list() {
    const res = await req.get(ENDPOINT_URL.toString());
    return formatResponse(res);
  }

  async function get(id: number) {
    const res = await req.get(getEntityUrl(id));
    return formatResponse(res);
  }

  async function create(data: Map<string, any>) {
    const res = await req.post(ENDPOINT_URL.toString(), { data });
    const formattedResponse = await formatResponse(res);
    Playwright.expect([200, 201]).toContain(formattedResponse.status);
    if (formattedResponse?.data?.id)
      createdEntityIds.push(formattedResponse?.data?.id);
    return formattedResponse;
  }

  async function update(id: number, data: Map<string, any>) {
    const res = await req.patch(getEntityUrl(id), { data });
    return formatResponse(res);
  }

  async function remove(id: number) {
    const res = await req.delete(getEntityUrl(id));
    const formattedResponse = await formatResponse(res);
    Playwright.expect(formattedResponse.data).toBe(null);
    Playwright.expect(formattedResponse.status).toBe(204);
    createdEntityIds.splice(createdEntityIds.indexOf(id), 1);
    return formattedResponse;
  }

  async function dispose() {
    await Promise.all(
      createdEntityIds.map(async (id) => req.delete(getEntityUrl(id))),
    );
  }
  return { req, list, get, create, update, remove, dispose };
};
