import { body, param } from 'express-validator';
import defineRequestValidator from '#shared/request/validation.js';

const assetIdParam = param('assetId').isInt();

export const entity = defineRequestValidator([assetIdParam]);

export const update = defineRequestValidator([
  assetIdParam,
  body('meta').isObject(),
]);

export const importFromLink = defineRequestValidator([
  body('url').isURL(),
]);

export const bulkRemove = defineRequestValidator([
  body('assetIds').isArray({ min: 1 }),
  body('assetIds.*').isInt(),
]);
