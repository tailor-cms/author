import type { AssetSource } from '@tailor-cms/interfaces/asset.ts';
import type { ContentType } from '@tailor-cms/interfaces/discovery.ts';
import type { RequestHandler } from 'express';
import type { Asset } from './asset.model.js';

export type { AssetSource };

export interface MulterFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export interface ImportFileOptions {
  repositoryId: number;
  userId: number;
  file: MulterFile;
  description?: string;
  tags?: string[];
  source?: AssetSource;
}

export interface ImportFromLinkOptions {
  contentType?: ContentType;
  title?: string;
  description?: string;
  downloadUrl?: string;
  author?: string;
  license?: string;
  tags?: string[];
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
  query: any;
  options: { limit: number; offset: number; order?: any[] };
  file: MulterFile;
  files: MulterFile[];
}

type AsyncHandler = (req: AssetRequest, res: any) => Promise<any>;

/** Cast typed handler to Express RequestHandler for router registration. */
export const handler = (fn: AsyncHandler) => fn as unknown as RequestHandler;
