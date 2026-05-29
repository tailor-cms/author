import express from 'express';

import * as actions from './actions/index.ts';
import authService from '#shared/auth/index.js';
import { authorize } from '#shared/auth/mw.js';
import { createActionMounter } from '#shared/request/action.ts';

const router = express.Router();
const mount = createActionMounter(router, '', 'Health');

// Liveness and readiness are public (uptime monitors and the load balancer
// hit them). The deep diagnostics endpoint is admin-only - it exposes
// latencies, infra hints, and error strings - gated like the other admin
// routes with JWT auth + an admin role check.
mount
  .get('/healthcheck', actions.healthcheck)
  .get('/health/live', actions.live)
  .get('/health/ready', actions.ready)
  .get('/health/status', actions.status, {
    before: [authService.authenticate('jwt'), authorize()],
  });

export default {
  path: '/',
  router,
};
