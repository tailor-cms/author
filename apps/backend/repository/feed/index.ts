import express from 'express';
import * as ctrl from './controller.ts';
import { middleware as sse } from '#shared/sse/index.js';
import { handler } from '../types.ts';

const router = express.Router();

router.get('/subscribe', sse, handler(ctrl.subscribe));

router
  .route('/')
  .get(handler(ctrl.fetchUserActivities))
  .post(handler(ctrl.addUserActivity))
  .delete(handler(ctrl.removeUserActivity));

export default {
  path: '/feed',
  router,
};
