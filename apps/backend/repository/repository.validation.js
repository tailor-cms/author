import { body } from 'express-validator';
import defineRequestValidator from '#shared/request/validation.js';

const addUserGroup = defineRequestValidator([
  body('userGroupId').notEmpty().isNumeric(),
]);

export default {
  addUserGroup,
};
