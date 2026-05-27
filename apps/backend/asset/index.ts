import express from 'express';
import multer from 'multer';

import db from '#shared/database/index.js';
import { createActionMounter } from '#shared/request/action.ts';
import { processPagination } from '#shared/database/pagination.js';

import * as actions from './actions/index.ts';
import discoveryRouter from './discovery/index.ts';
import indexingRouter from './indexing/index.ts';
import { getAsset } from './middleware.ts';

const { Asset } = db;

// `mergeParams: true` so the parent's `:repositoryId` propagates into
// `req.params` inside this sub-router.
const router = express.Router({ mergeParams: true });
const mount = createActionMounter(router, '/assets', {
  tag: 'Asset',
  group: 'Library',
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
});

router.param('assetId', getAsset);

// Literal sibling routes (`/import/link`, `/bulk/remove`) registered
// BEFORE the `/:assetId` param routes so they match first. Sub-routers
// (`/discover`, `/indexing`) likewise mount between the literals and the
// param routes.
mount
  .get('/', actions.list, { after: [processPagination(Asset, false)] })
  .post('/', actions.create, {
    before: [
      upload.fields([
        { name: 'files', maxCount: 10 },
        { name: 'file', maxCount: 1 },
      ]),
    ],
  })
  .post('/import/link', actions.importFromLink)
  .post('/bulk/remove', actions.bulkRemove);

router.use('/discover', discoveryRouter);
router.use('/indexing', indexingRouter);

mount
  .get('/:assetId/download', actions.download)
  .post('/:assetId/file', actions.attachFile, {
    before: [upload.single('file')],
  })
  .patch('/:assetId', actions.update)
  .delete('/:assetId', actions.remove);

export default {
  path: '/assets',
  router,
};
