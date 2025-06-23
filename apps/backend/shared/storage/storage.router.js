import express from 'express';
import multer from 'multer';
import ctrl from './storage.controller.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/', ctrl.getUrl).post('/', upload.single('file'), ctrl.upload);

export default {
  path: '/assets',
  router,
};
