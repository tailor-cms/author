import { StatusCodes } from 'http-status-codes';
import * as service from './asset.service.ts';

export async function list({ repository }, res) {
  const data = await service.list(repository.id);
  return res.json({ data });
}

export async function create({ repository, files, user }, res) {
  if (!files?.length) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ error: 'No files provided' });
  }
  const data = await service.upload(repository.id, files, user.id);
  return res.json({ data });
}

export async function importFromLink({ repository, body, user }, res) {
  const data = await service.importFromLink(
    repository.id, body.url, user.id,
  );
  return res.json({ data });
}

export async function download({ asset }, res) {
  const url = await service.getDownloadUrl(asset.storageKey);
  return res.json({ data: { url } });
}

export async function update({ asset, body }, res) {
  const data = await service.updateMeta(asset, body.meta);
  return res.json({ data });
}

export async function remove({ repository, asset }, res) {
  const data = await service.remove(repository, asset);
  return res.json({ data });
}

export async function bulkRemove({ repository, body }, res) {
  const deletedIds = await service.bulkRemove(
    repository, body.assetIds,
  );
  return res.json({ data: { deletedIds } });
}
