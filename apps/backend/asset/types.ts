import type { Request } from 'express';
import type { Asset } from './asset.model.js';

export interface MulterFile {
  fieldname: string;
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

/**
 * Express Request extended with properties injected by middleware:
 * - repository: from repository param handler
 * - user: from passport authentication
 * - asset: from asset param handler (routes with :assetId)
 * - file/files: from multer (file upload routes)
 */
export interface AssetRequest extends Request {
  repository: any; // TODO: type when repository.model.d.ts exists
  user: any; // TODO: type when user.model.d.ts exists
  asset: Asset;
  file: MulterFile;
  files: MulterFile[];
}
