// BE-side persistence glue for `@tailor-cms/config` schema snapshots.
// The registry owns identity, sha, source, drift detection, and the
// snapshot envelope shape. This file does two things only:
//   - decide *where* to persist the envelope inside a repo (`$$.schema`)
//   - drive the DB write
import { refreshSnapshot, adoptSchema } from '@tailor-cms/config';
import type { Snapshot } from '@tailor-cms/config';
import type { Schema } from '@tailor-cms/interfaces';
import type { Transaction } from 'sequelize';

import type { Repository } from '../models/repository.model.js';

type RepoData = Record<string, any> | undefined | null;

// Embeds `snapshot` under `data.$$.schema`, leaving any other keys in
// the `$$` system namespace untouched.
function embedSnapshot(data: RepoData, snapshot: Snapshot) {
  return {
    ...(data ?? {}),
    $$: { ...(data?.$$ ?? {}), schema: snapshot },
  };
}

// Returns a `data` blob with a snapshot embedded for `config`. The
// registry handles registration and envelope construction; this file
// just drops it into `$$.schema`. Used by the import processor.
export function pinSchemaSnapshot(data: RepoData, config: Schema) {
  return embedSnapshot(data, adoptSchema(config));
}

// Asks the registry whether `repository.data.$$.schema` is stale and
// persists a fresh snapshot when it is. No-op otherwise. Used by the
// load middleware to propagate bundle drift to stored snapshots.
export async function syncSchemaSnapshot(
  repository: Repository,
  transaction?: Transaction,
): Promise<boolean> {
  const snapshot = refreshSnapshot(
    repository.schema,
    repository.data?.$$?.schema,
  );
  if (!snapshot) return false;
  // `hooks: false` so this side-channel write does not flip
  // `hasUnpublishedChanges` or re-enter any update hook.
  await repository.update(
    { data: embedSnapshot(repository.data, snapshot) },
    { hooks: false, transaction },
  );
  return true;
}
