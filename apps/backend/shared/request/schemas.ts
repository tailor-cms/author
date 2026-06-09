// Reusable Zod building blocks for action input / response schemas.
// Centralised here so a "trimmed short text" rule reads identically across
// actions and any tightening happens in one place.
import { z, type ZodType } from 'zod';

// Standard `{ data: T }` response envelope. Non-`raw` actions wrap their
// return value as `{ data: ... }` (see defineAction's response contract);
// pass the inner shape through this helper when declaring an action's
// 200 response schema so the OpenAPI spec mirrors the wire shape.
export const dataEnvelope = <T extends ZodType>(inner: T) =>
  z.object({ data: inner });

// ISO-8601 timestamp with offset. Runtime validation stays strict (Zod's
// leap-year-aware regex); JSON Schema emits a clean `format: 'date-time'`
// instead of the giant pattern so Scalar renders a useful hint.
export const Timestamp = (desc = 'Timestamp (ISO-8601, with offset).') =>
  z.iso
    .datetime({ offset: true })
    .meta({ format: 'date-time', pattern: undefined })
    .describe(desc);

export const Uid = (desc = 'UID identifier.') =>
  z.uuid().meta({ format: 'uuid', pattern: undefined }).describe(desc);

// Standard createdAt / updatedAt / deletedAt triplet. Spread into an
// entity schema: `z.object({ ...timestamps(), ... })`. Pairs with the
// singular `Timestamp()` building block: one field vs the standard set.
export const timestamps = () => ({
  createdAt: Timestamp('Insertion timestamp.'),
  updatedAt: Timestamp('Last mutation timestamp.'),
  deletedAt: Timestamp('Soft-delete timestamp; non-null for archived rows.')
    .nullable(),
});

// Schema-driven JSONB blob. Used for `data` / `meta` / `refs` fields where
// the shape is dictated by the activity schema or plugin and we don't
// validate it at the API edge.
export const JsonObject = (desc = 'Schema-driven JSON blob.') =>
  z.record(z.string(), z.unknown()).describe(desc);

// Standard `{ items, total }` list-response envelope. Use for paginated
// collection endpoints so they all share one component in the OpenAPI
// doc.
export const Paginated = <T extends ZodType>(items: T, id?: string) => {
  const schema = z.object({
    items: z.array(items).describe('Page of rows.'),
    total: UInt().describe('Total rows matching the query (ignoring pagination).'),
  });
  return id ? schema.meta({ id }) : schema;
};

// Trimmed non-empty string with an upper bound. Default max=250 matches the
// historical limit applied to short-form fields (name, label, etc.).
export const ShortText = (min = 1, max = 250) =>
  z.string().trim().min(min).max(max);

// Trimmed string up to 2000 chars, used for description fields.
export const Description = (min = 1, max = 2000) =>
  z.string().trim().min(min).max(max);

// Positive integer (>=1) for body/response fields where JSON already
// types numbers. Covers ids, foreign keys, dimensions (width, height),
// and anything else that's naturally positive. The `positive`
// constraint also lets JSON Schema emit `minimum: 1`, so Scalar
// surfaces `1` as the example instead of MIN_SAFE_INTEGER.
export const Int = () => z.number().int().positive();

// Unsigned integer (>=0) for body/response fields where 0 is a
// meaningful value: sizes (an empty file is 0 bytes), counts,
// remaining-balance counters, etc.
export const UInt = () => z.number().int().nonnegative();

// Coerces a path / query string into a positive integer. Default for
// numeric path params (`:assetId`, `:repositoryId`, ...) and most
// query filters where 0 doesn't make sense (`limit`, `userId`,
// `tagId`). Pairs with `NonNegIntParam` for the 0-allowed cases.
export const IntParam = () => z.coerce.number().int().positive();

// Path-param schema for every route mounted under
// `/repositories/:repositoryId/...`. Slices extend this with their own
// path params via `RepositoryScopedParams.extend({ ... })` so the
// OpenAPI doc shows the full path-param chain (the upstream
// `getRepository` middleware already validated it at runtime).
export const RepositoryScopedParams = z.object({
  repositoryId: IntParam().describe('Repository the resource belongs to.'),
});

// Coerces a path / query string into an unsigned integer (>=0).
// Used for query params where 0 is legitimate — `offset` is the
// canonical case (page 1 = offset 0).
export const UIntParam = () => z.coerce.number().int().nonnegative();

// Boolean query parameter: accepts 'true'/'false' string literals as well
// as actual booleans. We avoid z.coerce.boolean() because it treats every
// truthy string as true, including 'false', which is the wrong shape for
// query strings.
export const QueryBoolean = z.union([
  z.boolean(),
  z.enum(['true', 'false']).transform((v) => v === 'true'),
]);

// Email field: lower-cased + trimmed.
export const Email = () => z.email().toLowerCase().trim();

// Array of integers that may arrive as:
//   - a real JSON array of numbers (`[1, 2]`)
//   - a comma-separated string (FormData stringification: `'1,2'`)
//   - an empty string / 'undefined' / 'null' (FormData rendering of empty array
//     or absent value) - treated as undefined
//   - a real array of string ints (`['1', '2']`)
export const IntArrayFromForm = () =>
  z.preprocess((v) => {
    if (v == null) return undefined;
    if (Array.isArray(v)) {
      return v.length ? v.map((x) => Number(x)) : undefined;
    }
    if (typeof v === 'string') {
      const trimmed = v.trim();
      if (!trimmed || trimmed === 'undefined' || trimmed === 'null') {
        return undefined;
      }
      return trimmed.split(',').filter(Boolean).map(Number);
    }
    return v;
  }, z.array(z.number().int()).optional());

// Array of strings that may arrive as a single string or as
// a real array (multiple). Used for `schemas[]`, `tagIds[]`, etc. URL
// query params, where qs may return either shape depending on cardinality.
export const StringArrayFromQuery = () =>
  z.preprocess((v) => {
    if (v == null) return undefined;
    if (Array.isArray(v)) return v.length ? v.map(String) : undefined;
    if (typeof v === 'string') return v ? [v] : undefined;
    return v;
  }, z.array(z.string()).optional());

// Binary file field for multipart/form-data action bodies. Emits
// `{ type: 'string', format: 'binary' }` in JSON Schema;
export const binaryFile = (description?: string) =>
  z.string().meta({ format: 'binary', ...(description && { description }) });

// Array of binary file fields, e.g. `files[]` in a multipart body.
export const binaryFileArray = (description?: string) =>
  z
    .array(z.string().meta({ format: 'binary' }))
    .meta({ ...(description && { description }) });

// Standard offset/limit pair for paginated list endpoints. Spread
// into the schema's `.object({...})` argument so the fields land at
// the top level alongside filters.
export const Pagination = () => ({
  offset: UIntParam().optional().describe('Pagination offset.'),
  limit: IntParam().optional().describe('Pagination limit.'),
});

// Standard sortBy/sortOrder pair. Pass an `as const` tuple of allowed
// columns to lock sortBy to the enum; omit for loose `string().max(64)`
// (free-form, validated downstream). sortOrder accepts upper and
// lower-case for tolerance to existing callers.
export const Sort = <T extends readonly [string, ...string[]]>(
  columns?: T,
) => ({
  sortBy: (columns ? z.enum(columns) : z.string().max(64))
    .optional()
    .describe('Sort column.'),
  sortOrder: z
    .enum(['ASC', 'DESC', 'asc', 'desc'])
    .optional()
    .describe('Sort direction.'),
});
