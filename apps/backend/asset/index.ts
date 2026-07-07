import express from 'express';
import multer from 'multer';

import * as actions from './actions/index.ts';
import { createActionMounter } from '#shared/request/action.ts';
import { createStreamingStorage } from './utils/streaming-storage.ts';
import { getAsset } from './middleware.ts';
import { processPagination } from '#shared/database/pagination.js';
import { storage as storageConfig } from '#config';
import db from '#shared/database/index.js';
import discoveryRouter from './discovery/index.ts';
import indexingRouter from './indexing/index.ts';

const { Asset } = db;

// Supplementary attachments (captions, transcripts); small
const ATTACHMENT_MAX_UPLOAD_SIZE = 25 * 1024 * 1024; // 25 MiB

// `mergeParams: true` so the parent's `:repositoryId` propagates into
// `req.params` inside this sub-router.
const router = express.Router({ mergeParams: true });
const mount = createActionMounter(router, '/assets', {
  tag: 'Asset',
  group: 'Library',
});

// Streams uploaded file straight to the storage provider (no disk/RAM
// spool); the engine stamps the storage key + size + image dimensions onto the
// file. Size limit is configurable via env (see config/storage).
const upload = multer({
  storage: createStreamingStorage(),
  limits: { fileSize: storageConfig.maxUploadSize, files: 10 },
});

// Small supplementary files buffered in memory; persisted directly by the
// service. Kept separate from the streaming upload above (no large media).
const attachmentUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: ATTACHMENT_MAX_UPLOAD_SIZE, files: 1 },
});

router.param('assetId', getAsset);

// Literal sibling routes (`/import/link`, `/bulk/remove`) registered
// BEFORE the `/:assetId` param routes so they match first. Sub-routers
// (`/discover`, `/indexing`) likewise mount between the literals and the
// param routes.
mount
  .get('/', actions.list, { after: [processPagination(Asset, false)] })
  .get('/folders', actions.listFolders)
  .delete('/folders', actions.deleteFolder)
  .post('/', actions.create, {
    before: [
      upload.fields([
        { name: 'files', maxCount: 10 },
        { name: 'file', maxCount: 1 },
      ]),
    ],
  })
  .post('/import/link', actions.importFromLink)
  .post('/bulk/remove', actions.bulkRemove)
  .post('/bulk/move', actions.move);

router.use('/discover', discoveryRouter);
router.use('/indexing', indexingRouter);

mount
  .get('/:assetId/download', actions.download)
  .get('/:assetId/thumbnail', actions.thumbnail)
  .get('/:assetId/usages', actions.usages)
  .post('/:assetId/file', actions.attachFile, {
    before: [attachmentUpload.single('file')],
  })
  .patch('/:assetId', actions.update)
  .delete('/:assetId', actions.remove);

export default {
  path: '/assets',
  router,
};
