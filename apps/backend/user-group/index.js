import express from 'express';
import { StatusCodes } from 'http-status-codes';
import { UserRole } from '@tailor-cms/common';

import * as validation from './user-group.validation.js';
import ctrl from './user-group.controller.js';

import { authorize } from '#shared/auth/mw.js';
import { createError } from '#shared/error/helpers.js';
import db from '#shared/database/index.js';

const { UserGroup, UserGroupMember } = db;
const router = express.Router();

router.param('id', getUserGroup);

router
  .route('/')
  .get(validation.listUserGroups, ctrl.list)
  .post(authorize(), validation.upsertUserGroup, ctrl.create);

router
  .route('/:id')
  .get(ctrl.get)
  .patch(validation.upsertUserGroup, ctrl.update)
  .delete(ctrl.remove);

router
  .route('/:id/users')
  .get(ctrl.getUsers)
  .post(validation.upsertUser, ctrl.upsertUser);

router.delete('/:id/users/:userId', ctrl.removeUser);

export default {
  path: '/user-group',
  router,
};

async function getUserGroup(req, _res, next, id) {
  const { user } = req;
  const group = await UserGroup.findByPk(id, { paranoid: false });
  if (!group) return createError(StatusCodes.NOT_FOUND, 'User group not found');
  // If the user is not an admin, check if user is a group admin
  if (!user.isAdmin()) {
    const isGroupAdmin = await UserGroupMember.findOne({
      where: { userId: user.id, groupId: group.id, role: UserRole.ADMIN },
    });
    if (!isGroupAdmin)
      return createError(StatusCodes.FORBIDDEN, 'Access denied');
  }
  req.userGroup = group;
  return next();
}
