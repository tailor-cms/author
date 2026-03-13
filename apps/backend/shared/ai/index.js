import express from 'express';
import multer from 'multer';

import * as validation from './ai.validation.js';
import ctrl from './ai.controller.js';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    cb(null, file.mimetype === 'application/pdf');
  },
});

router.post('/generate', validation.generate, ctrl.generate);

router.post(
  '/upload-documents',
  upload.array('files', 10),
  validation.uploadDocuments,
  ctrl.uploadDocuments,
);

router.get(
  '/vector-store/:vectorStoreId/status',
  validation.getVectorStoreStatus,
  ctrl.getVectorStoreStatus,
);

router.delete(
  '/vector-store/:vectorStoreId',
  validation.deleteVectorStore,
  ctrl.deleteVectorStore,
);

export default { path: '/ai', router };
