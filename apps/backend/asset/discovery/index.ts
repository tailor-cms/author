import express from 'express';
import { StatusCodes } from 'http-status-codes';
import { discovery as config } from '#config';
import * as ctrl from './discovery.controller.ts';
import * as validation from './discovery.validation.ts';
import { handler } from '../types.ts';

const router = express.Router({ mergeParams: true });

router.use((_req, res, next) => {
  if (!config.isEnabled) {
    return res
      .status(StatusCodes.SERVICE_UNAVAILABLE)
      .json({ error: 'Discovery not configured' });
  }
  next();
});

router.post('/', validation.discover, handler(ctrl.discover));

export default router;
