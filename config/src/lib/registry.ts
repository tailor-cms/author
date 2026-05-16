// Runtime schema registry. Bundled schemas (passed to `createRegistry`)
// are immutable; runtime extras (via `register`) augment the lookup.
// Owns sha caching so callers compare snapshots instead of recomputing.
import { getSchemaApi } from '@tailor-cms/config-parser';
import hashObject from 'hash-object';

// Where a schema in the registry came from. Derived; callers can't set.
//   'bundled'  - shipped with `@tailor-cms/config` at build time
//   'external' - registered at runtime (paste, import, re-registration)
export type SnapshotSource = 'bundled' | 'external';

// Snapshot envelope the registry produces for persistence.
export interface Snapshot {
  config: any;
  sha: string;
  source: SnapshotSource;
  updatedAt: string;
}

// Minimum a caller passes back when asking whether a stored snapshot
// still matches the registry.
export interface StoredSnapshot {
  sha?: string;
  source?: SnapshotSource;
}

export interface Registry {
  schema: ReturnType<typeof getSchemaApi>;
  register: (config: any) => void;
  // Returns the snapshot the caller should persist, or null when no
  // write is needed (stored is fresh, external, or id is unknown).
  refreshSnapshot: (
    id: string,
    stored: StoredSnapshot | undefined,
  ) => Snapshot | null;
  // Registers an external schema config and returns its snapshot
  // envelope. No-op register for bundled ids - they always win.
  adoptSchema: (config: any) => Snapshot;
}

// Canonical sha1 of a schema config. Package-internal so the registry
// stays the only place that hashes.
function sha1(config: any): string {
  return hashObject(config, { algorithm: 'sha1' });
}

export function createRegistry(
  bundled: ReadonlyArray<any>,
  contentElementTypes: string[],
): Registry {
  const bundledIds = new Set(bundled.map((s) => s.id));
  const shaCache = new Map<string, string>(
    bundled.map((s) => [s.id, sha1(s)]),
  );
  const schemas: any[] = [...bundled];
  const schema = getSchemaApi(schemas, contentElementTypes);

  // Adds an external schema config. Idempotent on id. No-op for
  // bundled ids so a stale snapshot can never shadow a live schema.
  function register(config: any) {
    if (!config?.id || bundledIds.has(config.id)) return;
    const idx = schemas.findIndex((s) => s.id === config.id);
    if (idx >= 0) schemas[idx] = config;
    else schemas.push(config);
    shaCache.set(config.id, sha1(config));
  }

  // Internal: builds the snapshot envelope for a known id. Throws on
  // unknown - public entry points guard or ensure registration first.
  function makeSnapshot(id: string): Snapshot {
    const sha = shaCache.get(id);
    const config = schemas.find((s) => s.id === id);
    if (!sha || !config) throw new Error(`Schema "${id}" is not registered`);
    return {
      config,
      sha,
      source: bundledIds.has(id) ? 'bundled' : 'external',
      updatedAt: new Date().toISOString(),
    };
  }

  function refreshSnapshot(
    id: string,
    stored: StoredSnapshot | undefined,
  ): Snapshot | null {
    const sha = shaCache.get(id);
    if (!sha) return null;
    // The pin (caller-owned) rule only applies while the id is still
    // external. If it migrates between bundled/external across deploys
    // the stored source becomes wrong and we refresh to correct it.
    const expectedSource: SnapshotSource =
      bundledIds.has(id) ? 'bundled' : 'external';
    if (expectedSource === 'external' && stored?.source === 'external') {
      return null;
    }
    if (stored?.sha === sha && stored?.source === expectedSource) return null;
    return makeSnapshot(id);
  }

  function adoptSchema(config: any): Snapshot {
    register(config);
    return makeSnapshot(config.id);
  }

  return { schema, register, refreshSnapshot, adoptSchema };
}
