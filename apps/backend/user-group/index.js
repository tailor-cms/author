import express from 'express';
import { StatusCodes } from 'http-status-codes';

import * as validation from './user-group.validation.js';
import ctrl from './user-group.controller.js';
import { createError } from '#shared/error/helpers.js';
import db from '#shared/database/index.js';

const { UserGroup } = db;
const router = express.Router();

router.param('id', getUserGroup);

router.route('/')
  .get(ctrl.list)
  .post(validation.upsertUserGroup, ctrl.create);

router.route('/:id')
  .get(ctrl.get)
  .patch(validation.upsertUserGroup, ctrl.update)
  .delete(ctrl.remove);

router.route('/:id/users')
  .get(ctrl.getUsers)
  .post(validation.upsertUser, ctrl.upsertUser);

router.delete('/:id/users/:userId', ctrl.removeUser);

export default {
  path: '/user-group',
  router,
};

async function getUserGroup(req, _res, next, id) {
  const group = await UserGroup.findByPk(id, { paranoid: false });
  if (!group) return createError(StatusCodes.NOT_FOUND, 'User group not found');
  req.userGroup = group;
  return next();
}
