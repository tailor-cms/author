import { body, param, query } from 'express-validator';
import defineRequestValidator from '#shared/request/validation.js';

const entityPathParams = [
  param('activityId').isInt(),
];

export const list = defineRequestValidator([
  // Include items for which parent is deleted
  query('detached').isBoolean().optional(),
  // Include only outline activities (type declared in the schema structure)
  query('outlineOnly').isBoolean().optional(),
]);

export const create = defineRequestValidator([
  body('uid').isUUID().optional(),
  body('parentId').isInt().optional(),
  body('type').isString().trim().escape().notEmpty(),
  body('position').isFloat().optional(),
  body('data').isObject().optional(),
  body('refs').isObject().optional(),
]);

export const get = defineRequestValidator(entityPathParams);

export const update = defineRequestValidator([
  ...entityPathParams,
  body('position').isFloat().optional(),
  body('data').isObject().optional(),
  body('refs').isObject().optional(),
]);

export const remove = defineRequestValidator(entityPathParams);

export const reorder = defineRequestValidator([
  ...entityPathParams,
  body('position').isFloat(),
]);

export const restore = defineRequestValidator(entityPathParams);

export const publish = defineRequestValidator(entityPathParams);

export const clone = defineRequestValidator([
  ...entityPathParams,
  // Target location
  body('repositoryId').isInt(),
  body('parentId').isInt().optional(),
  body('position').isFloat().optional(),
]);

export const getPreviewUrl = defineRequestValidator(entityPathParams);

export const updateWorkflowStatus = defineRequestValidator([
  ...entityPathParams,
  body('assigneeId').isInt().optional(),
  body('status').isString().trim().escape().notEmpty().optional(),
  body('priority').isString().trim().escape().notEmpty().optional(),
  body('description').isString().trim().escape().optional(),
  body('dueDate').isDate().optional(),
]);
