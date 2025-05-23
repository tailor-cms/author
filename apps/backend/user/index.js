import express from 'express';
import { StatusCodes } from 'http-status-codes';
import ctrl from './user.controller.js';
import {
  loginRequestLimiter,
  resetLoginAttempts,
  setLoginLimitKey,
} from './mw.js';
import { authorize } from '#shared/auth/mw.js';
import authService from '#shared/auth/index.js';
import db from '#shared/database/index.js';
import { processPagination } from '#shared/database/pagination.js';
import { requestLimiter } from '#shared/request/mw.js';

const { User } = db;
const router = express.Router();

// Public routes:
router
  .post(
    '/login',
    setLoginLimitKey,
    loginRequestLimiter,
    authService.authenticate('local', { setCookie: true }),
    resetLoginAttempts,
    ctrl.getProfile,
  )
  .post('/forgot-password', ctrl.forgotPassword)
  .use('/reset-password', requestLimiter(), authService.authenticate('token'))
  .post('/reset-password', ctrl.resetPassword)
  .post('/reset-password/token-status', (_, res) => {
    return res.sendStatus(StatusCodes.ACCEPTED);
  });

// Protected routes:
router
  .use(authService.authenticate('jwt'))
  .get('/', authorize(), processPagination(User, false), ctrl.list)
  .post('/', authorize(), ctrl.upsert)
  .get('/logout', authService.logout())
  .get('/me', ctrl.getProfile)
  .patch('/me', ctrl.updateProfile)
  .post('/me/change-password', ctrl.changePassword)
  .delete('/:id', authorize(), ctrl.remove)
  .post('/:id/reinvite', authorize(), ctrl.reinvite);

export default {
  path: '/users',
  router,
};
