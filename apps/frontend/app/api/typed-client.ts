// Typed API client built from the backend's OpenAPI spec.
//
//   import { api } from '@/api';
//   const tags = await api.tag.list();
//   const repo = await api.repository.get({ path: { repositoryId: 42 } });

import { createApiClient, createClient } from '@tailor-cms/api-client';
import { applyAuthInterceptor } from './request';

const client = createClient({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

applyAuthInterceptor(client.instance);

export const apiClient = createApiClient({ client });

export { apiClient as api };
