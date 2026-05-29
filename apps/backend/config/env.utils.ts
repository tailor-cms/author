// Building blocks for the env schema in `./env.ts`.
//
//   - Field preprocessors normalise raw env strings. For the optional
//     string/url/int fields a blank value (dotenv loads `KEY=` as '')
//     means "unset" and becomes `undefined`. A boolean can't be undefined,
//     so `bool` maps blank/unset/unrecognised to `false`; `yn` parses the
//     rest (true/false/yes/no/1/0/on/off, plus real booleans).
//   - Refinement helpers (`requireAny`, `requireTogether`, `requireFields`)
//     express the recurring cross-field rules applied in `superRefine`.
import { z } from 'zod';
import yn from 'yn';

export const parseUndef = (v: unknown) => (v === '' ? undefined : v);

// Optional integer fields
export const optInt = () =>
  z.preprocess(
    (v) => (v === '' || v == null ? undefined : Number(v)),
    z.number().int().optional(),
  );

// Required coerced integer with a default (> 0).
export const posInt = (def: number) =>
  z.coerce.number().int().positive().default(def);

// Required coerced integer with a default (>= 0).
export const nonNegInt = (def: number) =>
  z.coerce.number().int().nonnegative().default(def);

// `yn` maps real booleans and true/false/yes/no/1/0/on/off to a boolean
export const bool = z.preprocess((v) => yn(v) ?? false, z.boolean());

// Optional string fields
export const optStr = () => z.preprocess(parseUndef, z.string().optional());

// Required string (blank/unset fails); pass a min length for a floor
export const reqStr = (min = 0) =>
  z.preprocess(parseUndef, z.string().min(min));

// Optional URL fields
export const optUrl = () => z.preprocess(parseUndef, z.url().optional());

// Optional email fields
export const optEmail = () => z.preprocess(parseUndef, z.email().optional());

// At least one of `anyOf` must be set, else flag `path`.
export function requireAny<T>(
  ctx: z.RefinementCtx,
  opts: {
    values: T;
    anyOf: readonly (keyof T)[];
    message: string;
    path: keyof T;
  },
) {
  if (opts.anyOf.some((key) => opts.values[key])) return;
  ctx.addIssue({ code: 'custom', message: opts.message, path: [opts.path] });
}

// `keys` must be configured as a set: all present or all absent. Flags a
// partial group, keyed to the first var unless an explicit path is given.
export function requireTogether<T>(
  ctx: z.RefinementCtx,
  opts: {
    values: T;
    keys: readonly (keyof T)[];
    message: string;
    path?: keyof T;
  },
) {
  const present = opts.keys.filter((key) => opts.values[key]).length;
  if (present === 0 || present === opts.keys.length) return;
  ctx.addIssue({
    code: 'custom',
    message: opts.message,
    path: [opts.path ?? opts.keys[0]],
  });
}

// When `when` holds, every var in `required` must be set. Reports the
// missing ones in a single issue, keyed to the flag that triggered it.
export function requireFields<T>(
  ctx: z.RefinementCtx,
  opts: {
    when: boolean;
    label: string;
    path: keyof T;
    values: T;
    required: readonly (keyof T)[];
  },
) {
  if (!opts.when) return;
  const missing = opts.required.filter((key) => !opts.values[key]);
  if (!missing.length) return;
  ctx.addIssue({
    code: 'custom',
    message: `${opts.label} requires ${missing.join(', ')}.`,
    path: [opts.path],
  });
}

// `key` selects one config mode; it must not be combined with any of
// `excludes` (the other mode's vars). Flags the conflict on `key`.
export function requireExclusive<T>(
  ctx: z.RefinementCtx,
  opts: {
    values: T;
    key: keyof T;
    excludes: readonly (keyof T)[];
    message: string;
  },
) {
  if (!opts.values[opts.key]) return;
  if (!opts.excludes.some((k) => opts.values[k])) return;
  ctx.addIssue({ code: 'custom', message: opts.message, path: [opts.key] });
}

// Redis URL
export const optRedisUrl = () =>
  z.preprocess(
    parseUndef,
    z
      .url()
      .refine((s) => s.startsWith('redis://') || s.startsWith('rediss://'), {
        message: 'must be a redis:// or rediss:// URL',
      })
      .optional(),
  );
