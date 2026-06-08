import type { NextFunction, Response } from 'express';
import express from 'express';
import { StatusCodes } from 'http-status-codes';

import * as actions from './actions/index.ts';
import { createActionMounter } from '#shared/request/action.ts';
import { createError } from '#shared/error/helpers.js';
import { sessionStore } from './session/index.ts';

// `mergeParams: true` so the parent's `:repositoryId` propagates into
// `req.params` inside this sub-router.
const router = express.Router({ mergeParams: true });

const mount = createActionMounter(router, '/agent', {
  tag: 'Agent',
  group: 'AI',
});

router.param('sessionId', loadSession);

mount
  .get('/sessions', actions.list)
  .post('/sessions', actions.create)
  .get('/sessions/:sessionId', actions.get)
  .delete('/sessions/:sessionId', actions.remove)
  .post('/run', actions.run);

// Loads the session row, enforces the (user, repository) scope, and
// attaches it as `req.agentSession`. 404 when the session doesn't
// exist or belongs to a different repository (avoiding an existence
// oracle across repos); 403 when it exists under the current
// repository but belongs to a different user.
async function loadSession(
  req: any,
  _res: Response,
  next: NextFunction,
  sessionId: string,
) {
  const session = await sessionStore.get(sessionId);
  if (!session) return createError(StatusCodes.NOT_FOUND, 'Session not found');
  if (session.repositoryId !== req.repository?.id) {
    return createError(StatusCodes.NOT_FOUND, 'Session not found');
  }
  if (session.userId !== req.user?.id) {
    return createError(StatusCodes.FORBIDDEN, 'Access restricted');
  }
  req.agentSession = session;
  next();
}

export default { path: '/agent', router };
