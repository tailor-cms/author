import Storage from '../../repository/storage.ts';
import { buildThumbnailKey } from './storage-key.ts';

/**
 * Signed URL of an asset's cached thumbnail.
 */
export function getThumbnailUrl(
  repositoryId: number,
  uid: string,
): Promise<string> {
  return Storage.getFileUrl(buildThumbnailKey(repositoryId, uid));
}
