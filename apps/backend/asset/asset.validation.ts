import { AssetType } from '@tailor-cms/interfaces/asset.ts';
import { body, query } from 'express-validator';
import { CONTENT_TYPES } from '@tailor-cms/interfaces/discovery.ts';
import defineRequestValidator from '#shared/request/validation.js';
import pick from 'lodash/pick.js';
import { StatusCodes } from 'http-status-codes';
import yn from 'yn';

import { VideoLinkMode } from './asset.service.ts';

const ALLOWED_ORDER_COLUMNS = ['createdAt', 'name', 'type'];
const ALLOWED_ORDER_DIRECTIONS = ['ASC', 'DESC'];
const ASSET_TYPES: string[] = Object.values(AssetType);

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

/**
 * Parses and transforms the list query parameters.
 *
 * Video-provider links (YouTube, Vimeo, etc.) are stored as type='link'
 * but should appear under the video filter and be hidden from the link
 * filter. This middleware translates the UI type filter into a
 * videoLinkMode directive that the service layer uses to build the
 * correct Sequelize WHERE clause:
 *
 *   type=video  → videoLinkMode: 'include' (video assets + video-provider links)
 *   type=link   → videoLinkMode: 'exclude' (link assets minus video-provider links)
 *   type=other  → passed through as a plain type filter
 */
function parseListQuery(req: any, _res: any, next: any) {
  const q = req.query || {};
  const PASSTHROUGH_PARAMS = ['search', 'orderBy', 'orderDirection'];
  const parsed: Record<string, any> = pick(q, PASSTHROUGH_PARAMS);
  if (q.signed) parsed.signed = yn(q.signed);
  if (q.type) {
    const types = q.type.split(',').map((t: string) => t.trim());
    if (types.includes(AssetType.Video)) {
      parsed.videoLinkMode = VideoLinkMode.Include;
    } else if (types.length === 1 && types[0] === AssetType.Link) {
      parsed.videoLinkMode = VideoLinkMode.Exclude;
    } else {
      parsed.type = types;
    }
  }
  req.parsedQuery = parsed;
  next();
}

export const list = [
  ...defineRequestValidator([
    query('type')
      .optional()
      .custom((val: string) =>
        val.split(',').every((t: string) => ASSET_TYPES.includes(t.trim())),
      )
      .withMessage(`type must be one or more of: ${ASSET_TYPES.join(', ')}`),
    query('orderBy').optional().isIn(ALLOWED_ORDER_COLUMNS),
    query('orderDirection').optional().isIn(ALLOWED_ORDER_DIRECTIONS),
  ]),
  parseListQuery,
];

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
  body('meta.tags').optional().isArray(),
  body('meta.tags.*').optional().isString().trim(),
]);

export const bulkRemove = defineRequestValidator([
  body('assetIds').isArray({ min: 1 }),
  body('assetIds.*').isInt(),
]);
