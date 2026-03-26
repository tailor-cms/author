import express from 'express';

import * as ctrl from './indexing.controller.ts';
import * as validation from './indexing.validation.ts';
import { handler } from '../types.ts';
import { getAsset } from '../middleware.ts';

const router = express.Router({ mergeParams: true });

router.param('assetId', getAsset);

router.post('/', validation.create, handler(ctrl.create));
router.get('/status', handler(ctrl.status));

router.delete('/:assetId', handler(ctrl.remove));
router.get('/:assetId/status', handler(ctrl.status));

export default router;
