import type * as Playwright from '@playwright/test';
import { createApiClient, createClient } from '@tailor-cms/api-client';
import { expect } from '@playwright/test';

export interface Credentials {
  email: string;
  password: string;
}

export type TypedApi = ReturnType<typeof createApiClient>;

export interface EndpointResponse {
  status: number;
  data?: any;
}

const clients = new Map<string, TypedApi>();

// Signs in and returns the session cookie
const signIn = async (baseURL: string, { email, password }: Credentials) => {
  const res = await fetch(`${baseURL}/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(`Signing in as ${email} failed: ${res.status}`);
  return res.headers
    .getSetCookie()
    .map((it) => it.split(';')[0])
    .join('; ');
};

export const getApiAs = (user: Credentials) => {
  const cached = clients.get(user.email);
  if (cached) return cached;
  if (!process.env.APP_URL) throw new Error('APP_URL is not set!');
  const baseURL = new URL('/api', process.env.APP_URL).href;
  const client = createClient({ baseURL });
  let cookie: Promise<string> | undefined;
  client.instance.interceptors.request.use(async (config) => {
    cookie ??= signIn(baseURL, user);
    config.headers.Cookie = await cookie;
    return config;
  });
  const api = createApiClient({ client });
  clients.set(user.email, api);
  return api;
};

// Expects the server to refuse a request with the given status
export const expectRefused = (request: Promise<unknown>, status: number) =>
  expect(request).rejects.toMatchObject({ response: { status } });

export const formatResponse = async (
  res: Playwright.APIResponse,
): Promise<EndpointResponse> => {
  const body = (await res.text()) ? await res.json() : null;
  return { status: res.status(), data: body?.data || body };
};
