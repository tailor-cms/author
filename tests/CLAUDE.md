# tests - conventions (Playwright e2e)

Playwright end-to-end suite. `testDir: ./specs`, `workers: 1` (serial),
`baseURL = APP_URL` (default `http://localhost:3000`), trace + video
`on-first-retry`, CI retries 2. Layout: `pom/` (Page Objects), `specs/`
(functional / visual / a11y), `helpers/` + `fixtures/`, `api/`.

## Page Objects

- One class per component in `pom/<area>/` (areas: `editor`, `repository`,
  `catalog`, `admin`, `auth`, `workflow`, `common`).
- Constructor takes `(page, parent?)`; expose `readonly` Locator fields and
  action methods. Keep all selectors in the POM - never inline them in a
  spec. Reuse or extend an existing POM before adding a new one.

## Roles = filename suffix (important)

A functional spec's filename decides which user it runs as:

- `*.spec.ts` (no suffix) -> **chrome-admin** (the default; the admin
  project `testIgnore`s the other suffixes).
- `*.default-user.spec.ts` -> **chrome-default-user**.
- `*.collaborator.spec.ts` -> **chrome-collaborator**.

To exercise a flow as a non-admin, name the file with that role suffix.
Each role project depends on its `setup-*` project and loads auth via
`storageState: .auth-<role>.json`.

## Auth (storage state)

`setup-*` projects (`specs/<role>.setup.spec.ts`) sign a seeded test user in
via the `SignIn` POM and persist `.auth-<role>.json`; role projects reuse
it, so specs start already logged in. The users come from `fixtures/auth.ts`
(loaded from `tailor-seed/user.json`: `admin@` / `user@` /
`collaborator@gostudion.com`) - so the DB must be seeded (`pnpm seed`) or
auth setup fails.

## Seeding data

Build state through `helpers/seed.ts`, not by hand. Its `toX(page, ...)`
helpers seed a repo (via `api/SeedClient` / `api/ApiClient`) AND navigate:
`toSeededRepository`, `toEmptyRepository`, `toRepositoryAssets`,
`toSeededRepositoryWorkflow`, `toEmptyCollection`, `seedLinkedRepositories`.
Shape constants: `outlineSeed` (COURSE_SCHEMA), `collectionSeed`.

## Running

- Suites: `pnpm e2e:functional`, `pnpm e2e:visual` (Percy), `pnpm e2e:a11y`
  (axe; `specs/a11y`, `a11y-dark` + `a11y-light`). Visual specs live in
  `specs/visual`; both visual and a11y run as admin.
- Single spec: `cd tests && pnpm playwright test
  specs/functional/<area>/<name>.spec.ts --project=chrome-admin` (match
  `--project` to the file's role suffix; its `setup-<role>` runs first).
- `APP_URL` overrides the base URL (e.g. your `http://localhost:3001`).
