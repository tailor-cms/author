import express from 'express';

import * as actions from './actions/index.ts';
import authService from '#shared/auth/index.js';
import { authorize } from '#shared/auth/mw.js';
import { createActionMounter } from '#shared/request/action.ts';

const router = express.Router();

// Two sub-sections under a shared "Health" docs group:
//  - Classic: the original single `/healthcheck`.
//  - Probes:  the conventional `/health/*` endpoints (Kubernetes-style
//             liveness/readiness, with IETF health+json bodies).
const classic = createActionMounter(router, '', { tag: 'Classic', group: 'Health' });
const probes = createActionMounter(router, '', { tag: 'Probes', group: 'Health' });

classic.get('/healthcheck', actions.healthcheck);

// Liveness and readiness are public (uptime monitors and the load balancer
// hit them). The deep diagnostics endpoint is admin-only - it exposes
// latencies, infra hints, and error strings - gated like the other admin
// routes with JWT auth + an admin role check.
probes
  .get('/health/live', actions.healthcheck)
  .get('/health/ready', actions.ready)
  .get('/health/status', actions.status, {
    before: [authService.authenticate('jwt'), authorize()],
  });

export default {
  path: '/',
  router,
};
