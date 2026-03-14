import type { RequestHandler } from 'express';
import type { Asset } from './asset.model.js';

export interface MulterFile {
  fieldname: string;
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

/**
 * Properties available on the Express Request after middleware injection.
 * Intentionally not extending Express.Request to avoid type conflicts
 * with built-in properties (files, user). Controllers destructure only
 * the properties they need; the `handler` cast bridges the type gap
 * for router registration.
 */
export interface AssetRequest {
  repository: any;
  user: any;
  asset: Asset;
  body: any;
  file: MulterFile;
  files: MulterFile[];
}

type AsyncHandler = (req: AssetRequest, res: any) => Promise<any>;

/** Cast typed handler to Express RequestHandler for router registration. */
export const handler = (fn: AsyncHandler) => fn as unknown as RequestHandler;
