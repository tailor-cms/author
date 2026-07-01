# apps/frontend - conventions

Nuxt 4 (Vue 3, Vuetify 4, Pinia). App code in `apps/frontend/app/`. See the
root `CLAUDE.md` for the overview; this covers how to write code here.

## Structure

File-based routing in `pages/`; `layouts/`, `middleware/`, `plugins/`.
Auto-imported `composables/` (`useX`) and Pinia `stores/`. Components grouped
by area under `components/{editor,repository,catalog,admin,common,user}`.
Cross-cutting libs in `lib/`; the content-plugin registries live in
`lib/content-plugins/` (element / container / meta / plugin / component).

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
