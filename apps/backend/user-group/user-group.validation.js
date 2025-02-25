import { body } from 'express-validator';
import { UserRole } from '@tailor-cms/common';

import defineRequestValidator from '#shared/request/validation.js';

export const upsertUserGroup = defineRequestValidator([
  body('name').notEmpty().trim(),
]);

export const upsertUser = defineRequestValidator([
  body('email').notEmpty().isEmail().normalizeEmail(),
  body('role')
    .notEmpty()
    .isIn([UserRole.ADMIN, UserRole.USER, UserRole.COLLABORATOR]),
]);
