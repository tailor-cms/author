import { body } from 'express-validator';
import defineRequestValidator from '#shared/request/validation.js';
import { CONTENT_TYPES } from './types.ts';

export const discover = defineRequestValidator([
  body('query').isString().notEmpty().isLength({ max: 1000 }),
  body('contentFilter')
    .optional()
    .isString()
    .isIn(['all', ...CONTENT_TYPES]),
  body('count').optional().isInt({ min: 1, max: 100 }),
]);
