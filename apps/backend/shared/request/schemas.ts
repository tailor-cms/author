// Reusable Zod building blocks for Repository action input schemas.
// Centralised here so a "trimmed short text" rule reads identically across
// actions and any tightening happens in one place.
import { z } from 'zod';

// Trimmed non-empty string with an upper bound. Default max=250 matches the
// historical limit applied to short-form fields (name, label, etc.).
export const ShortText = (min = 1, max = 250) =>
  z.string().trim().min(min).max(max);

// Trimmed string up to 2000 chars, used for description fields.
export const Description = (min = 1, max = 2000) =>
  z.string().trim().min(min).max(max);

// Coerces a numeric path/query parameter from string to integer. Used for
// :repositoryId, :userId, :userGroupId, :tagId path params and for numeric
// filter query params.
export const IntParam = () => z.coerce.number().int();

// Boolean query parameter: accepts 'true'/'false' string literals as well
// as actual booleans. We avoid z.coerce.boolean() because it treats every
// truthy string as true, including 'false', which is the wrong shape for
// query strings (matches express-validator .toBoolean() parity).
export const QueryBoolean = z.union([
  z.boolean(),
  z.enum(['true', 'false']).transform((v) => v === 'true'),
]);

// Email field: lower-cased + trimmed. Matches the common subset of
// express-validator's .normalizeEmail() that the slice actually relied on.
export const Email = () => z.email().toLowerCase().trim();

// Array of integers that may arrive as:
//   - a real JSON array of numbers (`[1, 2]`)
//   - a comma-separated string (FormData stringification: `'1,2'`)
//   - an empty string / 'undefined' / 'null' (FormData rendering of empty array
//     or absent value) - treated as undefined
//   - a real array of string ints (`['1', '2']`)
export const IntArrayFromForm = () =>
  z.preprocess(
    (v) => {
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
    },
    z.array(z.number().int()).optional(),
  );

// Array of strings that may arrive as a single string or as
// a real array (multiple). Used for `schemas[]`, `tagIds[]`, etc. URL
// query params, where qs may return either shape depending on cardinality.
export const StringArrayFromQuery = () =>
  z.preprocess(
    (v) => {
      if (v == null) return undefined;
      if (Array.isArray(v)) return v.length ? v.map(String) : undefined;
      if (typeof v === 'string') return v ? [v] : undefined;
      return v;
    },
    z.array(z.string()).optional(),
  );
