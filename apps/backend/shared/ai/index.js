import express from 'express';
import ctrl from './ai.controller.js';

const router = express.Router();

router.post('/generate', ctrl.generate);

export default {
  path: '/ai',
  router,
};
