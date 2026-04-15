import { body } from 'express-validator';
import defineRequestValidator from '#shared/request/validation.js';

export const create = defineRequestValidator([
  body('assetIds').isArray({ min: 1, max: 100 }),
  body('assetIds.*').isInt(),
]);
