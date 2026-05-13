# /repository

Feature slice for the Repository entity and its sub-resources — members,
user-groups, tags, transfer jobs, reference integrity, and the SSE feed.

## Layout

Top-level `actions/` files are core CRUD / ops on the Repository entity
itself. Sub-resources get their own folder with an entity prefix
(`user-list`, `group-add`, …) so related endpoints cluster
alphabetically. Slice-internal helpers (validation shapes, snapshot
resolver) live in `lib/`. Feed follows the same `actions/` convention so
the sub-feature shape mirrors the slice shape.

## Action pattern

One endpoint = one `*.action.ts` file. Default export is a
`CompiledAction` built by `defineAction()` from
`#shared/request/action.ts`. Zod schemas (`Body`, `Query`, `Params`) are
both the validator and the source of the inferred type via
`z.infer<typeof Body>` and `Ctx<{ body: typeof Body }>`.

```ts
const Body = z.object({
  name: ShortText(2, 250),
  description: Description(2, 2000),
});
export type CreateBody = z.infer<typeof Body>;

export default defineAction({
  body: Body,
  openapi: { summary: 'Create a repository', authenticated: true },
  async handler({ body, user }) {
    return service.create(body, user);
  },
});
```

Short handlers stay inline. Multi-line handlers move to a top-level
`async function handler(ctx: Ctx<{ body: typeof Body }>) { … }` and are
passed to `defineAction({ …, handler })` to keep the file flat.

## Principles

- **Schema-first** — Zod schemas are the only source for validation,
  request types, and the OpenAPI doc at `/api/openapi.json`.
- **Vertical slice** — one file per HTTP endpoint, end-to-end.
- **Service extraction** — actions stay HTTP-shaped (parse `req` → call
  service → respond); DB / publishing / cross-model work lives in
  `repository.service.ts`.
- **Files by domain, not by layer** — folders match resource scope, not
  CRUD-vs-ops vs validation-vs-handler.
- **`<Action><Slot>` type names** — `CreateBody`, `ListQuery`,
  `RemoveUserParams`. Slot-aware; the schema *is* the wire shape, so no
  DTO indirection.

## Plumbing

- **Validation.** `defineAction` mounts a `safeParse` middleware per
  declared slot. Parsed values stash at `req._validated.{slot}` because
  Express 5 made `req.query` a read-only getter; the action wrapper
  reads from the stash when building the handler context. 400-error
  shape (`{ errors: [{ msg, path, location }] }`) matches the
  express-validator format used elsewhere.

- **Response contract** (three patterns the wrapper supports):

  | Handler does | Wrapper sends |
  |---|---|
  | `return value` | `200` + `{ data: value }` (or `value` verbatim if `raw: true`) |
  | (no return) / `return` / `return undefined` | `204` empty body |
  | `res.json(...)` / `res.end(...)` / stream via `res` | nothing — wrapper bails on `res.headersSent`, handler owns the response |

  `raw: true` is the opt-out used by `list` so the FE receives
  `{ total, items }` at top level.

- **OpenAPI.** `createActionMounter` registers every route in the
  shared registry at `apps/backend/shared/openapi/`. The emitter serves
  the 3.1 spec at `GET /api/openapi.json`.

- **`data` attr guard.** `Repository.data` is a free-form JSONB column,
  but its `$$` key is a system namespace (schema snapshot, AI
  side-channel) that has lifecycle on the server. Two-layer defence in
  `lib/data-attr.ts`:
    1. `RepoData` Zod schema validates FE input — strict `$$.schema`
       and `$$.ai` shapes; unknown `$$.foo` keys → 400.
    2. `stripServerManaged()` removes server-only paths
       (currently `$$.ai.storeId`) in `service.create` / `service.update`
       before persisting, so a future server-only key can be added in
       one place rather than relying on every validator to be updated.

- **Errors.** `createError(code, message)` returns
  `Promise.reject(httpError)`. Inside an action handler
  `return createError(...)` is safe — the wrapper awaits and forwards.
  In param middleware / guards, prefer `return createError(...)` over
  `throw createError(...)`: the thrown wrapper Promise surfaces as an
  unhandled rejection and Node 24 terminates the process for it by
  default (see `getRepository` for the safe pattern).

## Cross-references

- Cross-slice action helper: `apps/backend/shared/request/action.ts`
- Cross-slice OpenAPI registry / emitter: `apps/backend/shared/openapi/`
- Reusable Zod building blocks: `apps/backend/shared/request/schemas.ts`
  (`ShortText`, `Description`, `IntParam`, `QueryBoolean`, `Email`,
  `IntArrayFromForm`, `StringArrayFromQuery`).
