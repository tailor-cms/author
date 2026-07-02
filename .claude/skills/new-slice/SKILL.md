---
name: new-slice
description: >-
  Scaffold a new backend HTTP endpoint / vertical slice in apps/backend
  (Zod schema + defineAction + service + mounter) following the slice
  conventions. Use when adding a backend endpoint, action, or resource.
---

# New backend slice / endpoint

Read `apps/backend/README.md` first - it is the source of truth for this
framework. `apps/backend/tag/` is a minimal reference slice.

## Steps

1. **Location.** Add to an existing domain folder under `apps/backend/`,
   or create a new `<slice>/` with `actions/`, `schemas/`, `models/`,
   `<slice>.service.ts`.

2. **Schema (Zod).** Add `<slice>/schemas/<shape>.ts` exporting a Zod
   value + inferred type. Name by role: `Input` (write body/query),
   `Filter` (list query), `Params` (path ids). Barrel-export via
   `schemas/index.ts`.

3. **Action.** `<slice>/actions/<verb>.action.ts` default-exports
   `defineAction({ body?|query?|params?, handler })`. Verb-first filename
   (`get-source.ts`); entity-prefix only inside resource-cluster
   subfolders.

4. **Service.** Business/DB logic in `<slice>/<slice>.service.ts`.
   Services accept inferred types (not `req`) and **throw domain error
   classes** - never `createError`/HTTP.

5. **Errors in the action.** Map service domain errors via `instanceof`
   and `return createError(code, msg)` (not `throw`).

6. **Mount.** Register via `createActionMounter(...)`; declare literal
   routes before `:id` routes. Mounter order drives OpenAPI sidebar order.

7. **Client.** Types flow to `@tailor-cms/api-client` automatically (regen
   on boot) - never hand-edit generated output.

8. **Verify.** `pnpm --filter tailor-server type-check`; check `/api/docs`.
