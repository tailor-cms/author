import ctrl from './seed.controller.js';
import express from 'express';

const router = express.Router();

router
  .post('/reset', ctrl.resetDatabase)
  .post('/catalog', ctrl.seedCatalog)
  .post('/repository', ctrl.seedRepository)
  .post('/user', ctrl.seedUser);

export default {
  path: '/seed',
  router,
};
