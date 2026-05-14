// A Repository stores its target schema as a string id (`Repository.schema`)
// that points into the in-process `@tailor-cms/config` registry. Schemas
// can be deprecated or removed from the registry over time, so we keep a
// frozen backup of the resolved config under `data.$$.schema` and use it
// as a fallback when the registry no longer knows the id.
//
// The snapshot also enables "paste-mode": a caller may pre-populate
// `data.$$.schema` with `source: 'pasted'` before create, allowing a
// custom schema that never lives in the registry at all.
import hash from 'hash-object';
import { SCHEMAS, schema as schemaApi } from '@tailor-cms/config';
import type { RepositorySchemaSnapshot } from '@tailor-cms/interfaces/repository';
import type { Schema } from '@tailor-cms/interfaces';
import type { Transaction } from 'sequelize';

import { createLogger } from '#logger';
// Type-only import - erased at runtime, so no circular module load with
// repository.model.js (which imports the *runtime* sync helpers below).
import type { Repository } from '../models/repository.model.js';

const { getSchema } = schemaApi;

const logger = createLogger('repository:schema');

// sha1 of a Schema config; used for drift detection between the live
// registry and the stored snapshot. Stable across object-key order via
// hash-object's canonicalisation.
function hashSchemaConfig(config: Schema): string {
  return hash(config, { algorithm: 'sha1' });
}

// Live-registry lookup that swallows the "schema not found" throw and
// returns null instead, so call sites can branch cleanly.
function getLiveConfig(schemaId: string): Schema | null {
  try {
    return getSchema(schemaId);
  } catch {
    return null;
  }
}

// Read-only resolution: prefer the live registry (source of truth), fall
// back to the stored snapshot if the schema id has been removed from the
// registry. Throws only if both are missing.
export function resolveSchemaConfig(repository: Repository): Schema {
  const live = getLiveConfig(repository.schema);
  if (live) return live;
  const snapshot = repository.data?.$$?.schema?.config;
  if (snapshot) return snapshot as Schema;
  throw new Error(
    `Schema "${repository.schema}" is not registered and no snapshot ` +
      `is stored on this repository`,
  );
}

// Returns a fresh `data` attr with `$$.schema` set to a paste-mode
// snapshot of schema `config`.
export function seedPasteSnapshot(
  data: Record<string, unknown> | undefined | null,
  config: Schema,
): Record<string, unknown> {
  const snapshot: RepositorySchemaSnapshot = {
    sha: hashSchemaConfig(config),
    config,
    source: 'pasted',
    updatedAt: new Date().toISOString(),
  };
  return {
    ...(data ?? {}),
    $$: { ...((data as any)?.$$ ?? {}), schema: snapshot },
  };
}

interface WriteSnapshotArgs {
  // Target repository whose `data.$$.schema` is being updated.
  repository: Repository;
  // Schema config to snapshot.
  config: Schema;
  // Identity of the config (currently `hash-object` sha1). Lets later
  // reads detect drift without re-hashing.
  sha: string;
  // Where the snapshot came from: `'registry'` (server-driven, may be
  // overwritten on schema change) or `'pasted'` (FE-supplied, treated
  // as the source of truth - never overwritten by sync).
  source: RepositorySchemaSnapshot['source'];
  // Optional Sequelize transaction to participate in.
  transaction?: Transaction;
}

// Writes a snapshot into `data.$$.schema` via a full `data` merge so the
// surrounding system namespace (e.g. `$$.ai`) is preserved. Uses
// `{ hooks: false }` so this side-channel write does not flip
// `hasUnpublishedChanges` or trigger access updates.
async function writeSnapshot({
  repository,
  config,
  sha,
  source,
  transaction,
}: WriteSnapshotArgs) {
  const snapshot: RepositorySchemaSnapshot = {
    config,
    sha,
    source,
    updatedAt: new Date().toISOString(),
  };
  const nextData = {
    ...(repository.data ?? {}),
    $$: {
      ...(repository.data?.$$ ?? {}),
      schema: snapshot,
    },
  };
  await repository.update({ data: nextData }, { hooks: false, transaction });
}

// Boot-time sweep: walks every registered schema and ensures every
// repository pointing at it has a fresh snapshot. Use on an existing
// dataset to bootstrap snapshots for repos that were created before
// the snapshot feature shipped, or whose schema was updated between
// deploys. Idempotent, no-op for already-fresh repos.
//
// Runs non-blockingly from `apps/backend/index.ts` so server start time
// isn't gated on it; failures are logged, not fatal.
//
// The Repository model is passed in rather than imported here to keep
// this module free of the runtime cycle with `repository.model.js`
// (which imports the per-row sync helpers below at top level).
export async function syncAllSnapshots(
  RepositoryModel: any,
): Promise<void> {
  let totalSynced = 0;
  for (const live of SCHEMAS as unknown as Schema[]) {
    const liveSha = hashSchemaConfig(live);
    const candidates = await RepositoryModel.findAll({
      where: { schema: live.id },
      paranoid: false,
    });
    const stale = candidates.filter((repo: any) => {
      const stored = repo.data?.$$?.schema;
      return (
        !stored ||
        stored.sha !== liveSha ||
        stored.source !== 'registry'
      );
    });
    for (const repo of stale) {
      await writeSnapshot({
        repository: repo,
        config: live,
        sha: liveSha,
        source: 'registry',
      });
    }
    if (stale.length) {
      logger.info(
        { schema: live.id, count: stale.length, sha: liveSha },
        'Boot-synced schema snapshots',
      );
      totalSynced += stale.length;
    }
  }
  if (totalSynced > 0) {
    logger.info({ totalSynced }, 'Boot snapshot sync complete');
  }
}

// Brings the stored snapshot in line with the live registry config.
// Returns true when a write actually happened, false on no-op (already
// in sync, or the schema id is not in the registry at all).
export async function syncSchemaSnapshot(
  repository: Repository,
  transaction?: Transaction,
): Promise<boolean> {
  const live = getLiveConfig(repository.schema);
  if (!live) {
    logger.debug(
      { repositoryId: repository.id, schema: repository.schema },
      'Skipping snapshot sync; schema not in registry',
    );
    return false;
  }
  const liveSha = hashSchemaConfig(live);
  const stored = repository.data?.$$?.schema;
  if (stored?.sha === liveSha && stored?.source === 'registry') return false;
  await writeSnapshot({
    repository,
    config: live,
    sha: liveSha,
    source: 'registry',
    transaction,
  });
  logger.debug(
    { repositoryId: repository.id, schema: repository.schema, sha: liveSha },
    'Schema snapshot synced',
  );
  return true;
}
