// Repository.data JSONB blob; input shape + defensive stripping of
// server-managed fields.

// The `$$` key inside `data` is the system namespace - reserved for
// fields that need server lifecycle (schema snapshots, AI side-channel,
// etc.) rather than schema-defined meta values. We do two things:
//
//   1. Validate the FE input shape with Zod (rejects unknown $$.foo keys).
//   2. Defensive-strip server-managed fields in the service layer before
//      persisting (so a future server-only key can be added in one
//      place rather than relying on every validator to be updated).
import unset from 'lodash/fp/unset.js';
import { z } from 'zod';

// Schema snapshot stored by the server on create/update via
// `syncSchemaSnapshot`. FE may pre-populate this for paste-mode (custom
// schema not in the registry).
const SchemaSnapshot = z.object({
  sha: z.string(),
  config: z.unknown(),
  source: z.enum(['registry', 'pasted']),
  updatedAt: z.string(),
});

// AI property bag in the system namespace.
const AiContext = z.object({
  vectorStoreId: z.string().optional(),
}).strict();

const RepoSystemNs = z.object({
  schema: SchemaSnapshot.optional(),
  ai: AiContext.optional(),
}).strict();

// FE-input shape for `Repository.data`. `$$` is the system namespace with
// a validated shape; everything else is treated as schema-defined meta
// (arbitrary keys via `.catchall`).
export const RepoData = z
  .object({ $$: RepoSystemNs.optional() })
  .catchall(z.unknown());

export type RepoDataInput = z.infer<typeof RepoData>;

// Paths that may only be written by the server, never accepted from a
// caller. Extend this list when new server-managed fields are added.
const SERVER_ONLY_PATHS = ['$$.ai.storeId'] as const;

// Removes the server-managed paths from a data blob before persisting.
// Defensive: the Zod validator already rejects these via .strict(), but
// the strip belt-and-braces against future code paths that bypass the
// action validator.
export function stripServerManaged(
  data: Record<string, unknown> | undefined | null,
): Record<string, unknown> | undefined {
  if (!data) return data ?? undefined;
  return SERVER_ONLY_PATHS.reduce<Record<string, unknown>>(
    (acc, path) => unset(path, acc),
    data,
  );
}
