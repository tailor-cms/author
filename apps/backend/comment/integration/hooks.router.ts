import {
  webhookRequestLimiter,
  webhookSourceLimiter,
} from './middleware.ts';
import * as actions from './actions/index.ts';
import { createActionMounter } from '#shared/request/action.ts';
import express from 'express';

// Public, token-authenticated ingress for integrations. Mounted before
// the JWT guard
const router = express.Router();
const mount = createActionMounter(router, '/hooks/comments/integrations', {
  tag: 'Webhooks',
  group: 'Comment',
});

mount.post('/:token', actions.postMessage, {
  before: [webhookSourceLimiter, webhookRequestLimiter],
});

export default {
  path: '/hooks/comments/integrations',
  router,
};
