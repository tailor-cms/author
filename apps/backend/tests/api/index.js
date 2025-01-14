import express from 'express';

import ctrl from './seed.controller.js';
import { authorize } from '#shared/auth/mw.js';

const router = express.Router();

router
  .use(authorize())
  .post('/reset', ctrl.resetDatabase)
  .post('/catalog', ctrl.seedCatalog)
  .post('/repository', ctrl.seedRepository)
  .post('/user', ctrl.seedUser);

export default {
  path: '/seed',
  router,
};
