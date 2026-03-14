import { body, param } from 'express-validator';
import defineRequestValidator from '#shared/request/validation.js';

export const update = defineRequestValidator([
  param('assetId').isInt(),
  body('meta').isObject(),
]);

export const importFromLink = defineRequestValidator([
  body('url').isURL(),
]);

export const bulkRemove = defineRequestValidator([
  body('assetIds').isArray({ min: 1 }),
  body('assetIds.*').isInt(),
]);
