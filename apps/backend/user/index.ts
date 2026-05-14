import express from 'express';
import db from '#shared/database/index.js';
import { processPagination } from '#shared/database/pagination.js';
import { authorize } from '#shared/auth/mw.js';
import { requestLimiter } from '#shared/request/mw.js';
import authService from '#shared/auth/index.js';
import { createActionMounter } from '#shared/request/action.ts';

import * as actions from './actions/index.ts';
import {
  loginRequestLimiter,
  resetLoginAttempts,
  setLoginLimitKey,
} from './middleware.ts';

const { User } = db;

const router = express.Router();
const mount = createActionMounter(router, '/users');

// limiter + token-auth instance shared between the two
// reset-password routes so they pull from the same per-key counter
const resetLimiter = requestLimiter();
const resetTokenAuth = authService.authenticate('token');

// Public routes - registered first so they run before the
// `authenticate('jwt')` mw that protects everything below.
mount
  .post('/login', actions.login, {
    before: [
      setLoginLimitKey,
      loginRequestLimiter,
      authService.authenticate('local', { setCookie: true }),
      resetLoginAttempts,
    ],
  })
  .post('/forgot-password', actions.forgotPassword)
  .post('/reset-password', actions.resetPassword, {
    before: [resetLimiter, resetTokenAuth],
  })
  .post('/reset-password/token-status', actions.tokenStatus, {
    before: [resetLimiter, resetTokenAuth],
  });

// Everything past this point requires a valid JWT cookie.
router.use(authService.authenticate('jwt'));
// `authService.logout()` is a stateful passport-session helper that
// owns the response itself; doesn't fit the action wrapper, so it
// stays as a direct route mount.
router.get('/logout', authService.logout());

// Authenticated routes
mount
  .get('/me', actions.profileGet)
  .patch('/me', actions.profileUpdate)
  .post('/me/change-password', actions.changePassword);

// Admin-only
mount
  .get('/', actions.list, {
    before: [authorize()],
    after: [processPagination(User, false)],
  })
  .post('/', actions.upsert, { before: [authorize()] })
  .delete('/:id', actions.remove, { before: [authorize()] })
  .post('/:id/reinvite', actions.reinvite, { before: [authorize()] });

export default {
  path: '/users',
  router,
};
