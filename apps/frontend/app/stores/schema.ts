// Snapshot-aware schema store: tracks schema configs not in the bundled
// `@tailor-cms/config` registry (the snapshots the BE ships in
// `Repository.data.$$.schema.config`) and exposes a single schema API
// that falls back to them when the registry has no matching id.
import type { Schema } from '@tailor-cms/interfaces';
import { createAugmentedSchema } from '@tailor-cms/config';

interface SnapshotEntry {
  // sha of the originating snapshot; absent when the caller registered
  // a config without snapshot context (e.g. a future paste-flow that
  // hasn't been persisted yet).
  sha?: string;
  config: Schema;
}

export const useSchemaStore = defineStore('schema', () => {
  const extras = shallowReactive(new Map<string, SnapshotEntry>());

  function register(config: Schema, sha?: string) {
    if (!config?.id) return;
    const prev = extras.get(config.id);
    // Divergence: two repos carry snapshots with the same id but
    // different content. The id→config API can only hold one config
    // per id, so the loser's catalog card / cross-repo view will
    // display the winner's metadata. Surface it loudly;
    if (prev?.sha && sha && prev.sha !== sha) {
      console.warn(
        `[schema] divergent snapshot for "${config.id}": ` +
          `${prev.sha} → ${sha}; last-write wins.`,
      );
    }
    extras.set(config.id, { sha, config });
  }

  function registerFromRepository(repository: any) {
    const snapshot = repository?.data?.$$?.schema;
    if (snapshot?.config) register(snapshot.config, snapshot.sha);
  }

  function unregister(schemaId: string) {
    extras.delete(schemaId);
  }

  function $reset() {
    if (!extras.size) return;
    extras.clear();
  }

  const api = computed(() =>
    createAugmentedSchema(
      Array.from(extras.values(), (entry) => entry.config),
    ),
  );

  return { api, register, registerFromRepository, unregister, $reset };
});
