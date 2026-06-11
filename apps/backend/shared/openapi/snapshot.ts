// Snapshot OpenAPI document to disk.
//
// The `@tailor-cms/api-client` watcher reads the resulting file (via a
// native `fs.watch` on its parent dir) to drive codegen.
//
// In production the spec is already served live at `/api/openapi.json`
import fs from 'node:fs/promises';

import config from '#config';
import { createLogger } from '#logger';
import { buildOpenApiDocument } from './emitter.ts';

const logger = createLogger('openapi');

export async function writeOpenApiSnapshot(filePath: string): Promise<void> {
  if (config.isProduction) return;
  try {
    const doc = buildOpenApiDocument();
    await fs.writeFile(filePath, JSON.stringify(doc, null, 2));
    logger.info(`OpenAPI spec written to ${filePath}`);
  } catch (err) {
    logger.warn({ err }, 'Failed to write OpenAPI spec to disk');
  }
}
