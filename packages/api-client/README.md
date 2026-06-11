# @tailor-cms/api-client

Typed API client generated from the Tailor backend OpenAPI spec
(`/api/openapi.json`) using [@hey-api/openapi-ts][1].

[1]: https://heyapi.dev/

## Shape

Operations are grouped into per-slice namespaces so callers don't have
to import individual functions and the root surface stays uncluttered:

```ts
import { createClient } from '@hey-api/client-axios';
import { createApiClient } from '@tailor-cms/api-client';

const client = createClient({ baseURL: '/api', withCredentials: true });
// Reuse the FE's existing interceptors by attaching them to
// `client.instance` (a raw axios instance).
// client.instance.interceptors.response.use(...);

const api = createApiClient({ client });

await api.tag.list();
await api.repository.get({ params: { repositoryId: 42 } });
await api.repository.publish({ params: { repositoryId: 42 } });
await api.activity.list({ params: { repositoryId: 42 } });
```

The slice (`repository`, `tag`, `activity`, ...) and the method name
(`list`, `publish`, ...) are both decided at the backend — the emitter
stamps `operationId`, `x-tailor-slice`, and `x-tailor-method` on every
operation in the spec (see `apps/backend/shared/openapi/`). This file
just structures those into the `api.<slice>.<method>` shape.

## Regenerating

The pipeline reads `apps/backend/openapi.json`, which the backend
writes to disk on every boot. `node --watch` restarts the backend
whenever a backend source file changes, so the snapshot is fresh after
every meaningful code edit.

### Dev mode (auto)

`pnpm dev` (from the repo root) starts the backend, the frontend, and
this package's `pnpm watch` concurrently.
