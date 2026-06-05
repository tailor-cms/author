// Reusable Zod building blocks for Repository action input schemas.
// Centralised here so a "trimmed short text" rule reads identically across
// actions and any tightening happens in one place.
import { z, type ZodType } from 'zod';

// Standard `{ data: T }` response envelope. Non-`raw` actions wrap their
// return value as `{ data: ... }` (see defineAction's response contract);
// pass the inner shape through this helper when declaring an action's
// 200 response schema so the OpenAPI spec mirrors the wire shape.
export const dataEnvelope = <T extends ZodType>(inner: T) =>
  z.object({ data: inner });

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
