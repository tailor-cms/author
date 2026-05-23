import express from 'express';
import { StatusCodes } from 'http-status-codes';

import * as validation from './agent.validation.ts';
import { createError } from '#shared/error/helpers.js';
import ctrl from './agent.controller.ts';
import { handler } from './types.ts';
import { sessionStore } from './session/index.ts';

// https://expressjs.com/en/5x/api.html#express.router
const router = express.Router({ mergeParams: true });

router.param('sessionId', loadSession);

router
  .route('/sessions')
  .get(validation.list, handler(ctrl.index))
  .post(validation.create, handler(ctrl.create));

router
  .route('/sessions/:sessionId')
  .get(validation.get, handler(ctrl.show))
  .delete(validation.remove, handler(ctrl.remove));

router.post('/run', validation.run, handler(ctrl.run));

async function loadSession(
  req: any,
  _res: any,
  next: any,
  sessionId: string,
) {
  const session = await sessionStore.get(sessionId);
  if (!session) return createError(StatusCodes.NOT_FOUND, 'Session not found');
  if (session.userId !== req.user.id) {
    return createError(StatusCodes.FORBIDDEN, 'Access restricted');
  }
  if (session.repositoryId !== req.repository.id) {
    return createError(StatusCodes.NOT_FOUND, 'Session not found');
  }
  req.agentSession = session;
  next();
}

export default { path: '/agent', router };
