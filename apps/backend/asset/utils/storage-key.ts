import { randomUUID } from 'node:crypto';

// Builds a repository-scoped storage key for asset files.
// All asset library files live under repository/<repoId>/assets/
// Returns both the key and the generated uid (needed for the Asset record).
export function buildStorageKey(repositoryId: number, filename: string) {
  const uid = randomUUID();
  const key = `repository/${repositoryId}/assets/${uid}__${filename}`;
  return { uid, key };
}
