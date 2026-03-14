import { body, param } from 'express-validator';
import { StatusCodes } from 'http-status-codes';
import defineRequestValidator from '#shared/request/validation.js';

export function requireFiles(req: any, res: any, next: any) {
  if (req.files?.length) return next();
  return res
    .status(StatusCodes.BAD_REQUEST)
    .json({ errors: [{ msg: 'No files provided' }] });
}

export function requireFile(req: any, res: any, next: any) {
  if (req.file) return next();
  return res
    .status(StatusCodes.BAD_REQUEST)
    .json({ errors: [{ msg: 'No file provided' }] });
}

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
