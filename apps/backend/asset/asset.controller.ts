import type { Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import yn from 'yn';

import * as service from './asset.service.ts';

import type { AssetRequest } from './types.ts';

/**
 * Lists all assets for a repository, or resolves a storage key to a signed URL.
 * Consolidates the endpoint previously provided by the shared storage router.
 *
 * GET /assets              → { data: [Asset, ...] }
 * GET /assets?key=<key>    → { url: "https://..." }
 */
export async function list(
  { repository, query, options }: AssetRequest,
  res: Response,
) {
  if (query?.key) {
    const { publicUrl } = await service.getDownloadUrl(query.key);
    return res.json({ url: publicUrl });
  }
  const data = await service.list(repository.id, {
    search: query?.search,
    type: query?.type,
    signed: yn(query?.signed),
    ...options,
  });
  return res.json({ data });
}

/**
 * Unified upload handler. All uploads go through the asset service, creating
 * an asset library record for every file. The response shape varies by caller:
 *
 * Content element single-file upload (via 'file' field):
 *   POST /assets  (multipart: file)
 *   → { key, publicUrl, url: "storage://..." }
 *
 * Asset library upload (via 'files' field):
 *   POST /assets  (multipart: files[])
 *   → { data: [Asset, ...] }
 */
export async function create(req: any, res: Response) {
  const { file: [storageFile] = [], files: libraryFiles = [] } =
    req.files ?? {};
  const { repository, user } = req;
  const files = storageFile ? [storageFile] : libraryFiles;
  if (!files.length) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ errors: [{ msg: 'No files provided' }] });
  }
  const assets = await service.upload(repository.id, user.id, files);
  // CE single-file uploads expect { key, publicUrl, url } response shape
  if (storageFile) {
    return res.json(await service.getDownloadUrl(assets[0].storageKey));
  }
  return res.json({ data: assets });
}

/**
 * Creates an asset from a URL by fetching Open Graph metadata.
 *
 * POST /assets/import/link
 *   body: { url: "https://example.com/article", meta?: { title, description, ... } }
 *   → { data: Asset }
 */
export async function importFromLink(
  { repository, body, user }: AssetRequest,
  res: Response,
) {
  const data = await service.importFromLink(
    repository.id,
    user.id,
    body.url,
    body.meta,
  );
  return res.json({ data });
}

/**
 * Returns a signed download URL for an asset's stored file.
 * Only applicable to file-based assets (not links).
 *
 * GET /assets/:assetId/download
 *   → { data: { url: "https://signed-url..." } }
 */
export async function download({ asset }: AssetRequest, res: Response) {
  if (!asset.storageKey) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ error: 'Asset has no downloadable file' });
  }
  const { publicUrl } = await service.getDownloadUrl(asset.storageKey);
  return res.json({ data: { url: publicUrl } });
}

/**
 * Updates an asset's metadata (description, tags, etc.).
 *
 * PATCH /assets/:assetId
 *   body: { meta: { description: "...", tags: ["a", "b"] } }
 *   → { data: Asset }
 */
export async function update({ asset, body }: AssetRequest, res: Response) {
  const data = await service.updateMeta(asset, body.meta);
  return res.json({ data });
}

/**
 * Attaches a supplementary file to an existing asset under a named key.
 * Used for adding related files like captions or thumbnails.
 *
 * POST /assets/:assetId/file  (multipart: file, fileKey)
 *   body: { fileKey: "captions" }
 *   → { data: Asset }
 */
export async function attachFile(
  { asset, body, file }: AssetRequest,
  res: Response,
) {
  const data = await service.attachFile(asset, body.fileKey, file);
  return res.json({ data });
}

/**
 * Soft-deletes a single asset and removes its stored file from storage.
 *
 * DELETE /assets/:assetId
 *   → { data: Asset }
 */
export async function remove(
  { repository, asset }: AssetRequest,
  res: Response,
) {
  const data = await service.remove(repository, asset);
  return res.json({ data });
}

/**
 * Soft-deletes multiple assets by ID and removes their stored files.
 *
 * POST /assets/bulk/remove
 *   body: { assetIds: [1, 2, 3] }
 *   → { data: { deletedIds: [1, 2, 3] } }
 */
export async function bulkRemove(
  { repository, body }: AssetRequest,
  res: Response,
) {
  const deletedIds = await service.bulkRemove(repository, body.assetIds);
  return res.json({ data: { deletedIds } });
}
