# apps/backend - conventions

Express 5 + Sequelize 6, Zod-first, OpenAPI-emitting. **Read
`apps/backend/README.md`** - it is the source of truth for the slice /
action framework. This file lists the conventions worth keeping in mind.

## Slice pattern (detail in README)

One endpoint = one `<slice>/actions/<verb>.action.ts` via `defineAction`.
Zod schemas in `<slice>/schemas/` named `Input`/`Filter`/`Params`. DB and
cross-model logic in `<slice>/<slice>.service.ts`. Register routes with
`createActionMounter` (literal routes before `:id`). `apps/backend/tag/` is
a minimal reference slice.

## Conventions

- **Errors**: services throw domain error classes; actions map them via
  `instanceof` and `return createError(code, msg)` (not `throw`). Never
  build HTTP errors inside a service.
- **Action filenames** are verb-first (`get-source.ts`); use an entity
  prefix only inside resource-cluster subfolders.
- **Multiline definition / prompt text** uses backtick template literals,
  not `+` string concatenation.
- **Schema `ai.definition` / `outputRules`** describe activity-level purpose
  per schema type - never element-level format mechanics (HTML, `{content}`
  shape, CSS, tags, word counts).
- **Legacy dual-mode list/create asset endpoints** are intentional - don't
  refactor them.
- **Analyze usage first**: trace the consumer + library behaviour before
  adding a default; a static default can override a lib's smarter one.

## Client

Endpoint changes flow to `@tailor-cms/api-client` on boot - never hand-edit
generated output. Verify with `pnpm --filter tailor-server type-check` and
`/api/docs`.
