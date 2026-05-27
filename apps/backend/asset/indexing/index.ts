import type { NextFunction, Request, Response } from 'express';
import express from 'express';
import { StatusCodes } from 'http-status-codes';

import * as actions from './actions/index.ts';
import { ai as aiConfig } from '#config';
import { createActionMounter } from '#shared/request/action.ts';
import { getAsset } from '../middleware.ts';

// `mergeParams: true` so the parent's `:repositoryId` propagates into
// `req.params` inside this sub-router.
const router = express.Router({ mergeParams: true });
const mount = createActionMounter(router, '/indexing', 'AssetIndexing');

router.param('assetId', getAsset);

// AI config gate on the POST route only
const requireAi = (_req: Request, res: Response, next: NextFunction) => {
  if (!aiConfig.isEnabled) {
    return res
      .status(StatusCodes.SERVICE_UNAVAILABLE)
      .json({ error: 'AI not configured' });
  }
  return next();
};

// Literal /status registered BEFORE /:assetId so the param middleware
// doesn't swallow the word as an id.
mount
  .get('/status', actions.listStatuses)
  .post('/', actions.create, { before: [requireAi] })
  .get('/:assetId/status', actions.getStatus)
  .delete('/:assetId', actions.remove);

export default router;
