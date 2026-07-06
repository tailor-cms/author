// Public surface of @tailor-cms/api-client.
//
// Usage:
//   import { createClient } from '@hey-api/client-axios';
//   import { createApiClient } from '@tailor-cms/api-client';
//
//   const client = createClient({ baseURL: '/api', withCredentials: true });
//   const api = createApiClient({ client });
//   const tags = await api.tag.list();
//   const repo = await api.repository.get({ params: { repositoryId: 42 } });
//
// `createApiClient` and the operation types are emitted into `dist/` by
// `pnpm generate`; run it once before the frontend imports this package.
//  `dist/` is gitignored; the watcher in `scripts/watch.ts` keeps it fresh
//  during `pnpm dev`.
export * from '../dist/generated/types.gen';

// `aliases.gen` re-exports hey-api's `*Data`/`*Responses`/`*Errors`
// per-operation types under shorter, less ambiguous names:
//   `*Data`      → `*Req`        (request input: path + body + query)
//   `*Responses` → `*Res`        (status → response body map)
//   `*Response`  → `*Result`     (singular response body)
//   `*Errors`    → `*Err`        (status → error body map)
//   `*Error`     → `*ErrResult`  (singular error body)
// Both names resolve to the same types — prefer the aliased ones at
// call sites so it's clear whether a value is a request or a response.
export * from '../dist/aliases.gen';

export type { ApiClientOptions } from '../dist/api.gen';

// `Client` + `createClient` come from the external @hey-api/client-axios: the
// wrapper's own `ApiClientOptions.client` (in api.gen.ts) is typed against it,
// so the client the frontend builds and hands to `createApiClient` must be the
// same type.
export type { Client } from '@hey-api/client-axios';
export { createClient } from '@hey-api/client-axios';

// `formDataBodySerializer`, however, must come from the GENERATED bundled
// client (openapi-ts >= 0.98 vendors its own client under dist/generated/
// client). It's validated against the *SDK's* `Options.bodySerializer`, which
// is typed against that bundled client - whose `BodySerializer` differs from
// the external one (`body: unknown` vs `body: any`). Spread it into options
// for `multipart/form-data` endpoints (e.g. `api.repository.import`, asset
// uploads); without it, hey-api JSON-serializes the body and multer rejects
// the request as missing the file part.
export { formDataBodySerializer } from '../dist/generated/client';
export { createApiClient } from '../dist/api.gen';
