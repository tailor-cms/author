import { body, validationResult } from 'express-validator';
import express from 'express';
import { StatusCodes } from 'http-status-codes';

import ctrl from './user-group.controller.js';
import { createError } from '#shared/error/helpers.js';
import db from '#shared/database/index.js';

const { UserGroup } = db;
const router = express.Router();

const validateReq = [
  body('name').notEmpty().trim(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(StatusCodes.BAD_REQUEST).json({ errors: errors.array() });
    }
    next();
  },
];

router.param('id', getUserGroup);

router.route('/')
  .get(ctrl.list)
  .post(validateReq, ctrl.create);

router.route('/:id')
  .patch(validateReq, ctrl.update)
  .delete(ctrl.remove);

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
