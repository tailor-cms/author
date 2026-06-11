// Serves the committed OpenAPI artifact + the Scalar-rendered docs UI.
//
// Two routes, mounted at the API root:
//   GET /openapi.json - raw spec (cached after first read)
//   GET /docs         - HTML shell that loads Scalar from a CDN
//
// Mount via `router.use(openApiDocsRouter)` in `router.ts`. No path
// prefix - both endpoints are root-level
import type { Request, Response } from 'express';
import fs from 'node:fs/promises';
import express from 'express';

import { OPENAPI_SPEC_PATH } from './emitter.ts';

const SCALAR_PAGE = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Tailor CMS - API reference</title>
    <meta name="viewport" content="width=device-width,initial-scale=1">
  </head>
  <body>
    <script id="api-reference" data-url="/api/openapi.json"></script>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
  </body>
</html>`;

// Parsed once and memoised.
let cachedSpec: unknown;
async function loadSpec(): Promise<unknown> {
  try {
    return JSON.parse(await fs.readFile(OPENAPI_SPEC_PATH, 'utf-8'));
  } catch (err: any) {
    if (err?.code !== 'ENOENT') throw err;
    return {};
  }
}

const router = express.Router();

router.get('/openapi.json', async (_req: Request, res: Response) => {
  cachedSpec ??= await loadSpec();
  res.json(cachedSpec);
});

router.get('/docs', (_req: Request, res: Response) => {
  res.type('html').send(SCALAR_PAGE);
});

export default router;
