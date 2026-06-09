# shared/request

The action framework every slice uses to declare HTTP endpoints.

- **`defineAction({ body?, query?, params?, openapi?, handler })`** —
  Zod schemas validate each slot, the handler receives a typed
  `Ctx<{...}>`, and the wrapper auto-encodes the return value as
  `{ data: ... }` (or raw via `raw: true`, or 204 when the handler
  returns nothing). Errors thrown bubble through to the global error
  middleware.
- **`createActionMounter(router, basePath, { tag, group })`** — fluent
  binder that wires a `CompiledAction` onto Express AND registers it in
  the OpenAPI registry. Mounter declaration order drives Scalar sidebar
  order. Optional `before:` / `after:` middleware arrays compose into
  the per-route chain.
- **`schemas.ts`** — reusable Zod building blocks: `Timestamp`, `Uid`,
  `timestamps`, `JsonObject`, `Paginated(T, id)`, `Pagination`,
  `Sort`, plus typed `IntParam` / `UIntParam` / `Email` / `ShortText`
  primitives. Always reach for one of these before declaring a raw
  `z.string()` / `z.number()`.

The framework is intentionally thin: it owns validation, the response
envelope, and the OpenAPI surface — nothing else.
