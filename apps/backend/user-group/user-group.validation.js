import { body, query } from 'express-validator';
import { UserRole } from '@tailor-cms/common';

import defineRequestValidator from '#shared/request/validation.js';

export const listUserGroups = defineRequestValidator([
  query('filter').isString().isLength({ max: 100 }).optional(),
]);

export const createUserGroup = defineRequestValidator([
  body('name').isString().trim().notEmpty(),
  body('logoUrl').isString().trim().optional(),
]);

export const updateUserGroup = defineRequestValidator([
  body('name').isString().trim().notEmpty().optional(),
  body('logoUrl').isString().trim().optional(),
]);

export const upsertUser = defineRequestValidator([
  body('email').notEmpty().isEmail().normalizeEmail(),
  body('role')
    .notEmpty()
    .isIn([UserRole.ADMIN, UserRole.USER, UserRole.COLLABORATOR]),
]);
