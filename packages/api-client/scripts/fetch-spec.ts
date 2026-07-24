// Copies the backend's OpenAPI snapshot for codegen.
//
// The backend uses `node --watch ./index.ts` for dev, which restarts
// the whole process on any source change. `index.ts` calls
// `buildOpenApiDocument()` and writes `openapi.json` after `app.listen`,
// so every dev reload produces a fresh file.
import fs from 'node:fs/promises';
import path from 'node:path';

import {
  BACKEND_SPEC_PATH,
  SPEC_PATH,
  isScriptEntrypoint,
} from './paths.ts';

interface OpenApiDoc {
  paths?: Record<string, Record<string, unknown>>;
}

const readBackendSpec = async (): Promise<OpenApiDoc> => {
  try {
    const raw = await fs.readFile(BACKEND_SPEC_PATH, 'utf-8');
    return JSON.parse(raw) as OpenApiDoc;
  } catch (err: any) {
    if (err?.code !== 'ENOENT') throw err;
    throw new Error(`Backend spec not found at ${BACKEND_SPEC_PATH}.`, {
      cause: err,
    });
  }
};

const countOperations = (doc: OpenApiDoc): number => {
  let count = 0;
  for (const pathItem of Object.values(doc.paths ?? {})) {
    count += Object.keys(pathItem).length;
  }
  return count;
};

export const fetchSpec = async (): Promise<{ operationCount: number }> => {
  console.log(`Reading ${BACKEND_SPEC_PATH}`);
  const doc = await readBackendSpec();
  await fs.mkdir(path.dirname(SPEC_PATH), { recursive: true });
  await fs.writeFile(SPEC_PATH, `${JSON.stringify(doc, null, 2)}\n`);
  const operationCount = countOperations(doc);
  console.log(`Wrote ${SPEC_PATH} (${operationCount} operations).`);
  return { operationCount };
};

if (isScriptEntrypoint(import.meta.url)) {
  fetchSpec().catch((err: unknown) => {
    console.error(err);
    process.exit(1);
  });
}
