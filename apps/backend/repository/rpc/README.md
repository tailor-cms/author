# /rpc

Server-side execution hook for content-element packages. Mounted under
`/repositories/:repositoryId/rpc/:type/:procedure`.

## What it is

Each content-element plugin (a `@tailor-cms/ce-*` package) can export a
`procedures` map alongside its hooks - a named set of server-side
functions the element's authoring UI can invoke. The browser-side
`$rpc(procedure, payload)` helper that the plugin's Edit/Toolbar
components receive lands here, where the registry dispatches by `type`
and `procedure` to the actual handler.

The procedure handler shape is the upstream xt contract
([`ProcedureHandler`](https://github.com/tailor-cms/xt/blob/main/packages/common/src/hook-interfaces.ts)):

```ts
type ProcedureHandler<P = Record<string, any>, R = any> = (
  services: HookServices,
  payload: P,
) => R | Promise<R>;
```

## How the services bag is wired

At dispatch time Tailor supplies the procedure handler with this bag:

- `config` — env-derived plugin config gathered from any `TCE_*` env
  var (see `apps/backend/config/tce.ts`).
- `storage` — the repository file-storage abstraction. Lets a plugin
  persist files alongside the assets the repository already manages.
- `context: { userId, repository }` — author-side scoping so the
  handler knows who called and which repository it's acting on.

## Relationship to element hooks

The same services bag is passed to content-element lifecycle hooks
(`beforeSave`, `afterSave`, `afterRetrieve`, `beforeDisplay`,
`onUserInteraction`, …) by `elementRegistry.getHook`. Procedures are
the on-demand sibling of those: same composition + same
`services.context`, but invoked imperatively from the FE via
`$rpc('name', payload)` instead of around the element's CRUD lifecycle.
That symmetry is the point — a plugin can structure server work the
same way regardless of whether it should fire automatically or in
response to a user action.

## Trust boundary: element ownership

The route is **type-scoped, not element-scoped**: it carries `:type`
and `:procedure`, never an element id.

What this layer guarantees:
- the caller is authenticated, and
- the caller has access to the repository at `:repositoryId`
  (enforced by the parent slice's `hasRepositoryAccess` mw).

What this layer does NOT do:
- load any content-element row, or
- check that an element id referenced inside the payload actually
  belongs to the current repository.

TODO: Improve access management
