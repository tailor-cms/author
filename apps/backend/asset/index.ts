import express from 'express';
import multer from 'multer';
import * as ctrl from './asset.controller.ts';
import * as validation from './asset.validation.ts';
import indexingRouter from './indexing/index.ts';
import discoveryRouter from './discovery/index.ts';
import { uploaderInclude } from './asset.service.ts';
import { handler } from './types.ts';
import { createError } from '#shared/error/helpers.js';
import { processPagination } from '#shared/database/pagination.js';
import db from '#shared/database/index.js';

const { Asset } = db;

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
});

async function getAsset(req: any, _res: any, next: any, assetId: any) {
  const asset = await Asset.findByPk(assetId, {
    include: [uploaderInclude],
  });
  if (!asset || asset.repositoryId !== req.repository.id) {
    return createError(404, 'Asset not found');
  }
  req.asset = asset;
  next();
}

router.param('assetId', getAsset);

router
  .route('/')
  .get(processPagination(Asset, false), handler(ctrl.list))
  .post(
    upload.fields([
      { name: 'files', maxCount: 10 },
      { name: 'file', maxCount: 1 },
    ]),
    handler(ctrl.create),
  );

router.post('/import/link', validation.importFromLink, handler(ctrl.importFromLink));
router.post('/bulk/remove', validation.bulkRemove, handler(ctrl.bulkRemove));

// Sub-features (static paths before parameterized)
router.use('/index', indexingRouter);
router.use('/discover', discoveryRouter);

// Single asset
// Get download URL for asset
router.get('/:assetId/download', handler(ctrl.download));

// Attach file to asset (e.g. adding captions to a video)
router.post(
  '/:assetId/file',
  upload.single('file'),
  validation.requireFile,
  validation.attachFile,
  handler(ctrl.attachFile),
);

router.use('/:assetId/index', indexingRouter);
router
  .route('/:assetId')
  .patch(validation.update, handler(ctrl.update))
  .delete(handler(ctrl.remove));

export default {
  path: '/assets',
  router,
};
