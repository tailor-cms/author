import type * as Playwright from '@playwright/test';
import { createApiClient, createClient } from '@tailor-cms/api-client';

export interface Credentials {
  email: string;
  password: string;
}

export type TypedApi = ReturnType<typeof createApiClient>;

export interface EndpointResponse {
  status: number;
  data?: any;
}
const sessions = new Map<string, Promise<TypedApi>>();

const openSession = async ({ email, password }: Credentials) => {
  if (!process.env.APP_URL) throw new Error('APP_URL is not set!');
  const baseURL = new URL('/api', process.env.APP_URL).href;
  const client = createClient({ baseURL });
  const { headers } = await client.instance.post('/users/login', {
    email,
    password,
  });
  const cookies = headers['set-cookie'] ?? [];
  client.instance.defaults.headers.common.Cookie = cookies
    .map((it) => it.split(';')[0])
    .join('; ');
  return createApiClient({ client });
};

// The generated API client, signed in as `user`. Signs in once per user
// and reuses the session, like the other clients do for the admin
export const signInAs = (user: Credentials) => {
  if (!sessions.has(user.email)) sessions.set(user.email, openSession(user));
  return sessions.get(user.email)!;
};

export const formatResponse = async (
  res: Playwright.APIResponse,
): Promise<EndpointResponse> => {
  const body = (await res.text()) ? await res.json() : null;
  return { status: res.status(), data: body?.data || body };
};
