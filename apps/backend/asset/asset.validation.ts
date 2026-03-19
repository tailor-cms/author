import { body, query } from 'express-validator';
import { CONTENT_TYPES } from '@tailor-cms/interfaces/discovery.ts';
import { StatusCodes } from 'http-status-codes';
import defineRequestValidator from '#shared/request/validation.js';

const ALLOWED_ORDER_COLUMNS = ['createdAt', 'name', 'type'];
const ALLOWED_ORDER_DIRECTIONS = ['ASC', 'DESC'];

export function requireFiles(req: any, res: any, next: any) {
  const files = req.files;
  // Support both upload.array() (files is array) and upload.fields() (files is object)
  const hasFiles = Array.isArray(files)
    ? files.length > 0
    : files?.files?.length || files?.file?.length;
  if (hasFiles) return next();
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

export const list = defineRequestValidator([
  query('orderBy').optional().isIn(ALLOWED_ORDER_COLUMNS),
  query('orderDirection').optional().isIn(ALLOWED_ORDER_DIRECTIONS),
]);

export const update = defineRequestValidator([
  body('meta').isObject(),
]);

export const attachFile = defineRequestValidator([
  body('fileKey').isString().trim().notEmpty(),
]);

export const importFromLink = defineRequestValidator([
  body('url').isURL(),
  body('meta').optional().isObject(),
  body('meta.contentType').optional().isIn(CONTENT_TYPES),
  body('meta.title').optional().isString().trim(),
  body('meta.description').optional().isString().trim(),
  body('meta.downloadUrl').optional().isURL(),
  body('meta.author').optional().isString().trim(),
  body('meta.license').optional().isString().trim(),
]);

export const bulkRemove = defineRequestValidator([
  body('assetIds').isArray({ min: 1 }),
  body('assetIds.*').isInt(),
]);
