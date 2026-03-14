import type { AssetRequest } from '../types.ts';
import type { ContentFilter } from './types.ts';
import type { Response } from 'express';

import discoveryService from './discovery.service.ts';

export async function discover({ body, repository }: AssetRequest, res: Response) {
  const { query, contentFilter, count } = body as {
    query: string;
    contentFilter?: ContentFilter;
    count?: number;
  };
  const data = await discoveryService.search(
    query, repository, contentFilter, count,
  );
  return res.json({ data });
}
