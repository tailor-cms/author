import type { Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import * as indexingService from './indexing.service.ts';
import { ai as aiConfig } from '#config';

import type { AssetRequest } from '../types.ts';

export async function create({ repository, body }: AssetRequest, res: Response) {
  if (!aiConfig.isEnabled) {
    return res
      .status(StatusCodes.SERVICE_UNAVAILABLE)
      .json({ error: 'AI not configured' });
  }
  const data = await indexingService.index(repository, body.assetIds);
  if (!data) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ error: 'No matching assets found' });
  }
  return res.json({ data });
}

export async function status({ repository, asset }: AssetRequest, res: Response) {
  const data = await indexingService.getStatus(repository.id, asset?.id);
  return res.json({ data });
}

export async function remove(
  { repository, asset }: AssetRequest,
  res: Response,
) {
  const data = await indexingService.deindex(repository, asset);
  return res.json({ data });
}
