import { randomUUID } from 'node:crypto';
import path from 'node:path';

// Max filename length in the storage key.
// Key format: repository/<repoId>/assets/<uuid>__<filename>
// Fixed overhead is ~67 chars, leaving 188 for filename within VARCHAR(255).
// Capped at 120 for headroom.
const MAX_FILENAME_LENGTH = 120;

function truncateFilename(filename: string): string {
  if (filename.length <= MAX_FILENAME_LENGTH) return filename;
  const ext = path.extname(filename);
  const name = filename.slice(0, MAX_FILENAME_LENGTH - ext.length);
  return `${name}${ext}`;
}

export { truncateFilename };

function assetDir(repositoryId: number) {
  return `repository/${repositoryId}/assets`;
}

// Builds a repository-scoped storage key for asset files.
// All asset library files live under repository/<repoId>/assets/
// Returns both the key and the generated uid (needed for the Asset record).
export function buildStorageKey(repositoryId: number, filename: string) {
  const uid = randomUUID();
  const key = `${assetDir(repositoryId)}/${uid}__${truncateFilename(filename)}`;
  return { uid, key };
}

// Builds a repository-scoped key for a supplementary file (e.g. captions)
// attached to an existing asset. Same base dir, own uuid.
// Relationship to parent is tracked in meta.files, not in the key.
export function buildAttachmentKey(
  repositoryId: number,
  fileKey: string,
  filename: string,
) {
  const uid = randomUUID();
  return `${assetDir(repositoryId)}/${uid}__${fileKey}__${truncateFilename(filename)}`;
}
