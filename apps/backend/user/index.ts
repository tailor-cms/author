import express from 'express';

import {
  loginRequestLimiter,
  resetLoginAttempts,
  setLoginLimitKey,
} from './middleware.ts';
import * as actions from './actions/index.ts';
import authService from '#shared/auth/index.js';
import db from '#shared/database/index.js';
import { authorize } from '#shared/auth/mw.js';
import { createActionMounter } from '#shared/request/action.ts';
import { processPagination } from '#shared/database/pagination.js';
import { requestLimiter } from '#shared/request/mw.js';

const { User } = db;
const router = express.Router();

// Sidebar order tracks mounter declaration order (via createActionMounter's
// internal counter); declare here in the order the docs should read.
const GROUP = 'User';

const crud = createActionMounter(router, '/users', {
  tag: 'CRUD (admin)', group: GROUP,
});

const auth = createActionMounter(router, '/users', {
  tag: 'Authentication', group: GROUP,
});

const recovery = createActionMounter(router, '/users', {
  tag: 'Password recovery', group: GROUP,
});

const profile = createActionMounter(router, '/users', {
  tag: 'Profile', group: GROUP,
});

// limiter + token-auth instance shared between the two
// reset-password routes so they pull from the same per-key counter
const resetLimiter = requestLimiter();
const resetTokenAuth = authService.authenticate('token');

// Public routes - registered first so they run before the
// `authenticate('jwt')` mw that protects everything below.
auth.post('/login', actions.login, {
  before: [
    setLoginLimitKey,
    loginRequestLimiter,
    authService.authenticate('local', { setCookie: true }),
    resetLoginAttempts,
  ],
});

recovery
  .post('/forgot-password', actions.forgotPassword)
  .post('/reset-password', actions.resetPassword, {
    before: [resetLimiter, resetTokenAuth],
  })
  .post('/reset-password/token-status', actions.tokenStatus, {
    before: [resetLimiter, resetTokenAuth],
  });

// Everything past this point requires a valid JWT cookie.
router.use(authService.authenticate('jwt'));

auth.get('/logout', actions.logout, {
  before: [authService.logout({ middleware: true })],
});

// Authenticated self-service
profile
  .get('/me', actions.profileGet)
  .patch('/me', actions.profileUpdate)
  .post('/me/change-password', actions.changePassword);

// Admin CRUD on the user collection. `reinvite` sits here because it
// re-runs the invitation side-effect of POST / on a specific user.
crud
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
