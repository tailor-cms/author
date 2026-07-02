---
name: scaffold-extension
description: >-
  Scaffold a new Tailor content extension - content element (ce), content
  container (cc), meta input (mi), or plugin (pl) - and wire it into the
  registry. Use when adding a new ce/cc/mi/pl extension to the platform.
---

# Scaffold a content extension

Tailor has four extension types. Packages live in
`packages/core-extensions/<type>/<name>/` and are aggregated into the app
by the registries in `extensions/<type>/{client,server}.js`.

## Steps

1. **Pick the type** and read the matching guide in
   `docs/dev/extensions/` (content-elements, content-containers,
   meta-inputs, plugins).

2. **Create the package source.** There is no source generator - mirror an
   existing sibling package under `packages/core-extensions/<type>/<name>/`
   (each ships an edit/client side and a server side). The CLI in step 4
   only registers and installs a package that already exists; it does not
   write its source.

3. **Respect naming.** Packages are prefixed `@tailor-cms/ce-*` (elements),
   `@tailor-cms/tcc-*` (containers), `@tailor-cms/tp-*` (plugins). Each
   ships an edit/client side and a server side.

4. **Register + wire it via the CLI - do NOT hand-edit the registry.**
   `extensions/<type>/{client,server}.js`, `types.js`, and `enum.ts` are
   GENERATED from `extensions/<type>/registry.json`; hand-edits get
   overwritten. The installer is interactive (inquirer), so ask the user to
   run it via the `!` prefix:
   - element -> `pnpm ce add`
   - container -> `pnpm cc add`
   - meta input -> `pnpm mi add`
   - plugin -> `pnpm pl add`
   `add` (aliases `i`/`install`) appends the entry to `registry.json`, runs
   `pnpm add` for the client (and server) package, then regenerates those
   export modules. If you edit `registry.json` directly, run
   `pnpm <type> rebuild` to regenerate.

5. **Follow FE conventions** (see `apps/frontend/CLAUDE.md`): dumb
   components + composables, `is`/`has` boolean props, `ns:action` events,
   decompose into focused subcomponents.

6. **Verify.** `pnpm build`, then `pnpm dev` and confirm the extension
   appears and persists. For library/API questions use the context7 MCP.
