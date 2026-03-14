import type { Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import * as service from './asset.service.ts';

import type { AssetRequest } from './types.ts';

export async function list({ repository }: AssetRequest, res: Response) {
  const data = await service.list(repository.id);
  return res.json({ data });
}

export async function create({ repository, files, user }: AssetRequest, res: Response) {
  const data = await service.upload(repository.id, files, user.id);
  return res.json({ data });
}

export async function importFromLink(
  { repository, body, user }: AssetRequest,
  res: Response,
) {
  const data = await service.importFromLink(repository.id, body.url, user.id);
  return res.json({ data });
}

export async function download({ asset }: AssetRequest, res: Response) {
  if (!asset.storageKey) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ error: 'Asset has no downloadable file' });
  }
  const url = await service.getDownloadUrl(asset.storageKey);
  return res.json({ data: { url } });
}

export async function update(
  { asset, body }: AssetRequest,
  res: Response,
) {
  const data = await service.updateMeta(asset, body.meta);
  return res.json({ data });
}

export async function attachFile(
  { asset, body, file }: AssetRequest,
  res: Response,
) {
  const data = await service.attachFile(asset, body.fileKey, file);
  return res.json({ data });
}

export async function remove(
  { repository, asset }: AssetRequest,
  res: Response,
) {
  const data = await service.remove(repository, asset);
  return res.json({ data });
}

export async function bulkRemove({ repository, body }: AssetRequest, res: Response) {
  const deletedIds = await service.bulkRemove(repository, body.assetIds);
  return res.json({ data: { deletedIds } });
}
