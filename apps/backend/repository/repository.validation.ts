import { body } from 'express-validator';
import defineRequestValidator from '#shared/request/validation.js';

export const addUserGroup = defineRequestValidator([
  body('userGroupId').notEmpty().isNumeric(),
]);
