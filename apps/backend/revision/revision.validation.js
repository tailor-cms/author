import { param, query } from 'express-validator';
import defineRequestValidator from '#shared/request/validation.js';

const entityPathParams = [param('revisionId').isInt()];

export const get = defineRequestValidator(entityPathParams);

export const list = defineRequestValidator([
  query('entity')
    .isIn(['ACTIVITY', 'CONTENT_ELEMENT', 'REPOSITORY'])
    .optional(),
  query('entityId').isInt().optional(),
]);

export const getStateAtMoment = defineRequestValidator([
  query('activityId').isInt(),
  query('timestamp').isISO8601({ strict: true, strictSeparator: true }),
  query('elementIds').isArray().optional(),
]);
