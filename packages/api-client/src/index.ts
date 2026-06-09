// Public surface of @tailor-cms/api-client.
//
// Usage:
//   import { createClient } from '@hey-api/client-axios';
//   import { createApiClient } from '@tailor-cms/api-client';
//
//   const client = createClient({ baseURL: '/api', withCredentials: true });
//   const api = createApiClient({ client });
//   const tags = await api.tag.list();
//   const repo = await api.repository.get({ path: { repositoryId: 42 } });
//
// `createApiClient` and the operation types are emitted into `dist/` by
// `pnpm generate`; run it once before the frontend imports this package.
//  `dist/` is gitignored; the watcher in `scripts/watch.ts` keeps it fresh
//  during `pnpm dev`.
export { createClient } from '@hey-api/client-axios';
export { createApiClient } from '../dist/api.gen.ts';
export type { ApiClientOptions } from '../dist/api.gen.ts';
export type { Client } from '@hey-api/client-axios';
export * from '../dist/generated/types.gen.ts';
