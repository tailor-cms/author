import express from 'express';
import { UserRole } from '@tailor-cms/common';

import ctrl from './seed.controller.js';
import { authorize } from '#shared/auth/mw.js';

const router = express.Router();

router
  .use(authorize(UserRole.ADMIN, UserRole.USER, UserRole.COLLABORATOR))
  .post('/reset', ctrl.resetDatabase)
  .post('/catalog', ctrl.seedCatalog)
  .post('/repository', ctrl.seedRepository)
  .post('/user', ctrl.seedUser);

export default {
  path: '/seed',
  router,
};
