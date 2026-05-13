import express from 'express';
import { middleware as sseMiddleware } from '#shared/sse/index.js';
import { createActionMounter } from '#shared/request/action.ts';
import subscribe from './actions/subscribe.action.ts';
import activityList from './actions/activity-list.action.ts';
import activityAdd from './actions/activity-add.action.ts';
import activityRemove from './actions/activity-remove.action.ts';

const router = express.Router();

const mountAction = createActionMounter(
  router,
  '/repositories/:repositoryId/feed',
);

mountAction.get('/subscribe', subscribe, { before: [sseMiddleware] });
mountAction
  .get('/', activityList)
  .post('/', activityAdd)
  .delete('/', activityRemove);

export default {
  path: '/feed',
  router,
};
