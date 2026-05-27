import type { NextFunction, Request, Response } from 'express';
import express from 'express';
import { StatusCodes } from 'http-status-codes';

import * as actions from './actions/index.ts';
import { createActionMounter } from '#shared/request/action.ts';
import { discovery as config } from '#config';

// `mergeParams: true` so the parent's `:repositoryId` propagates into
// `req.params` inside this sub-router.
const router = express.Router({ mergeParams: true });
const mount = createActionMounter(router, '/discover', {
  tag: 'Discovery',
  group: 'Library',
});

// Config gate: 503 if discovery is disabled at runtime.
router.use((_req: Request, res: Response, next: NextFunction) => {
  if (!config.isEnabled) {
    return res
      .status(StatusCodes.SERVICE_UNAVAILABLE)
      .json({ error: 'Discovery not configured' });
  }
  return next();
});

mount.post('/', actions.discover);

export default router;
