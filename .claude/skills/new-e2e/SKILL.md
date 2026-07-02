---
name: new-e2e
description: >-
  Scaffold a Playwright Page Object plus a functional spec in tests/,
  following the POM conventions. Use when adding an end-to-end test for a
  feature or flow.
---

# New e2e test (Playwright)

See `tests/CLAUDE.md` for the conventions and `tests/pom/repository/` for
reference Page Objects.

## Steps

1. **Page Object.** Add `tests/pom/<area>/<Component>.ts` - a class with a
   `(page, parent?)` constructor, `readonly` Locator fields, and action
   methods. Keep selectors here; never inline them in specs. Reuse an
   existing POM if the component already has one.

2. **Spec.** Add `tests/specs/functional/<area>/<name>.spec.ts` that drives
   the app through the POM. Seed state via the API using `helpers/seed.ts`
   `toX(page, ...)` helpers (they seed AND navigate) - these call the seed
   endpoint (`api/SeedClient` -> `/api/seed/*`) or the REST API
   (`api/ApiClient`). For state the seed endpoint/API can't create, build it
   through the POMs / the FE in the spec.

3. **Pick the role (filename decides it).** Default to **admin** - a plain
   `<name>.spec.ts` runs as `chrome-admin`. Only use another role when the
   test is specifically about that role's behaviour (permissions, access,
   restricted UI): name the file `<name>.default-user.spec.ts` ->
   `chrome-default-user` or `<name>.collaborator.spec.ts` ->
   `chrome-collaborator`. Each role project depends on its `setup-*` project
   for auth state.

4. **Run one spec.**
   `cd tests && pnpm playwright test specs/functional/<area>/<name>.spec.ts
   --project=chrome-admin`
   (the matching `setup-admin` project runs first).

5. **Visual / a11y.** Add Percy coverage under `specs/visual/` and axe
   under `specs/a11y/` only if the feature needs it.
