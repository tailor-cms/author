# apps/backend

Express + Sequelize backend for the Tailor CMS authoring app. ESM,
Zod-first request validation, OpenAPI emitted from the
same schemas.

## Stack

- **Runtime** — Node 24.2+, Express 5, Passport (local + JWT + OIDC),
  pino logging.
- **Database** — PostgreSQL 9.4+ via Sequelize 6, Umzug migrations
  auto-applied on boot (gated by `DATABASE_DISABLE_MIGRATIONS_ON_STARTUP`).
- **KV / SSE / rate-limit** — optional Redis via `@keyv/redis`; falls
  back to in-memory.
- **Storage** — pluggable provider (filesystem / S3); see
  `shared/storage/`.
- **AI** — OpenAI Responses API + vector stores (optional; gated by
  `AI_SECRET_KEY` + `AI_MODEL_ID`).

## Slice anatomy

One endpoint = one `*.action.ts` file. The action framework
(`shared/request/action.ts`) provides `defineAction({ body?, query?,
params?, openapi?, handler })` which:

1. mounts schema-validated middleware per declared slot,
2. invokes the typed handler with parsed values,
3. wraps the return value (`{ data: value }`, or raw, or 204),
4. pushes route metadata into the OpenAPI registry.

Schemas live in `<slice>.schema.ts` as Zod values — actions consume
them via `defineAction({ body: schemas.CreateInput })`, services
consume the same schema's inferred type (`payload: CreateInput`). The
HTTP slot info lives in the `body:` / `query:` / `params:` key, not in
the name.

```ts
// repository/repository.schema.ts
export const CreateInput = z.object({
  name: ShortText(2, 250),
  description: Description(2, 2000),
});
export type CreateInput = z.infer<typeof CreateInput>;

// repository/actions/create.action.ts
export default defineAction({
  body: schemas.CreateInput,
  async handler({ body, user }) {
    return service.create(body, user);
  },
});

// repository/repository.service.ts
export async function create(payload: CreateInput, user: User) { … }
```

### Naming

Role-suffix, verb-first, layer-neutral:

| Suffix | Role | Example |
|---|---|---|
| `Input` | write payload (body, or write-style query) | `CreateInput` |
| `Filter` | read filter / list narrowing (query) | `ListFilter` |
| `Params` | path identifier | `RemoveUserParams` |

## Conventions

- **Schema-first** — Zod is the only source for validation, types, and
  the OpenAPI doc at `/api/openapi.json` (Scalar UI at `/api/docs`).
- **Vertical slice** — one file per HTTP endpoint, end-to-end.
- **Service extraction** — actions stay HTTP-shaped (parse `req` → call
  service → respond); DB / cross-model work lives in
  `<slice>.service.ts`. Services accept inferred types, not raw `req`.
- **Files by domain, not by layer** — sub-resources cluster in folders
  (`actions/members/`, `actions/transfer/`) rather than by CRUD-vs-ops.
- **Operation context** — write hooks read `{ userId, linkSync?,
  isNestedLinkedContent?, repository? }` from Sequelize options to
  drive revisions, SSE, linked-content propagation. `hooks: false` is
  used surgically to break recursion.
- **`Repository.data.$$`** — system namespace inside the JSONB column
  (schema snapshot, AI side-channel). Validated by `RepoData` Zod
  schema; server-managed paths stripped in the service via
  `stripServerManaged`.

## Plumbing details

- **Validation.** `safeParse` per slot; on failure responds with
  `{ errors: [{ msg, path, location }] }` (matches the legacy
  express-validator envelope). Parsed values stash at
  `req._validated.{slot}` because Express 5 made `req.query` a
  read-only getter.
- **Response contract** — handler returns a value (200 + `{ data }` /
  raw), returns `undefined` (204), or writes to `res` directly (SSE,
  streams).
- **Errors.** `createError(code, message)` from `shared/error/helpers.js`
  returns a rejected promise. In handlers prefer `return createError(…)`
  over `throw createError(…)` so the rejection is awaited by the
  framework rather than surfacing as an unhandled rejection.
- **Path ordering.** Literal sibling routes (`/link`, `/resolve`,
  `/import`, `/time-travel`) are registered *before* the corresponding
  `:id` param route so they match first.
- **Two validation styles coexist.** New code uses `defineAction` +
  Zod; `asset/` and `shared/ai/` still use express-validator (see
  `shared/request/validation.js`). Both produce the same `{ errors }`
  envelope.
