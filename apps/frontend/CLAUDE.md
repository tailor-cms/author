# apps/frontend - conventions

Nuxt 4 (Vue 3, Vuetify 4, Pinia). App code in `apps/frontend/app/`. See the
root `CLAUDE.md` for the overview; this covers how to write code here.

## Structure

File-based routing in `pages/`; `layouts/`, `middleware/`, `plugins/`.
Auto-imported `composables/` (`useX`) and Pinia `stores/`. Components grouped
by area under `components/{editor,repository,catalog,admin,common,user}`.
Cross-cutting libs in `lib/`; the content-plugin registries live in
`lib/content-plugins/` (element / container / meta / plugin / component).

## Nuxt setup

- **SPA, not SSR** (`ssr: false`, built with `nuxt generate`). No
  server-rendering / hydration - don't add SSR-only code or rely on request
  context; everything runs client-side.
- **API access**: default to the generated typed client
  `@tailor-cms/api-client` (set up in `app/api/typed-client.ts`, injected as
  `$api`) - call `api.<slice>.<method>()` from Pinia stores / composables.
  The old `app/api/*` axios modules (`request` + `extractData`) are
  **legacy**, kept only for assets and AI; don't extend them. Never use Nuxt
  `useFetch` / `useAsyncData` / `$fetch`. The dev server reverse-proxies
  `/api/**` to the backend (`routeRules` in `nuxt.config.ts`).
- **App services** are provided in `plugins/core-services.ts`, consumed via
  `inject`: `$schemaService`, `$storageService`, `$api`. The mitt event bus
  is `plugins/eventbus.ts`.
- **Vuetify** is wired by hand in `plugins/vuetify.ts` (+ `build.transpile`
  and `vuetify/styles`), not a Nuxt module - register global config there.
- **Plugins load in order** (`01.setup.ts` first). Forms use vee-validate +
  yup (`plugins/vee-validate.ts`, `yup.ts`).
- **Route guards** live in `middleware/` (`auth.ts`, `has-admin-access.ts`);
  OIDC auth is `plugins/oidc.ts`.

## Component conventions

- **Dumb by default.** Presentational components take props / emit events;
  push data-fetching and logic into `composables/` and Pinia stores.
- **Decompose.** Split a large component into a directory of focused,
  single-purpose subcomponents rather than one growing file.
- **Boolean props** use `is`/`has` prefixes (`isOpen`, `hasError`).
- **Events** are namespaced `ns:action` (`save:element`, `delete:element`).
- **Reuse** `packages/utils`, `@tailor-cms/common`, `core-components`, and
  `lodash-es` instead of hand-rolling helpers.
- **Shallow nesting** - guard clauses / early returns, not deep if/else.

## Gotchas

- **AI**: content generation is exposed via `inject('$doTheMagic')`, provided
  by `components/editor/ActivityContent/index.vue`.

## Docs

Use the `context7` MCP for Nuxt 4 / Vuetify 4 / Pinia API questions rather
than model memory.
