import express from 'express';
import ctrl from './tag.controller.js';

const router = express.Router();

router.get('/', ctrl.list);

export default {
  path: '/tags',
  router,
};
