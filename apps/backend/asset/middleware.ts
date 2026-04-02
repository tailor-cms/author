import { StatusCodes } from 'http-status-codes';
import { createError } from '#shared/error/helpers.js';
import { UPLOADER_INCLUDE } from './asset.service.ts';
import db from '#shared/database/index.js';

const { Asset } = db;

export async function getAsset(req: any, _res: any, next: any, assetId: string) {
  const asset = await Asset.findByPk(assetId, { include: [UPLOADER_INCLUDE] });
  if (!asset || asset.repositoryId !== req.repository.id) {
    throw createError(StatusCodes.NOT_FOUND, 'Asset not found');
  }
  req.asset = asset;
  next();
}
