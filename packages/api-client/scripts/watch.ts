// Watches `apps/backend/openapi.json` and reruns the full `generate`
// pipeline when its content actually changes.
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

import { generate } from './generate.ts';
import { BACKEND_SPEC_PATH, isScriptEntrypoint } from './paths.ts';

const hashFile = async (file: string): Promise<string | null> => {
  try {
    const data = await fs.readFile(file);
    return createHash('sha1').update(data).digest('hex');
  } catch (err: any) {
    if (err?.code === 'ENOENT') return null;
    throw err;
  }
};

class SpecWatcher {
  private running = false;
  private lastHash: string | null = null;

  async start(): Promise<void> {
    console.log(`👀 Watching ${BACKEND_SPEC_PATH}`);
    // Kick once so an already-present spec at startup regenerates.
    void this.tick();
    const dir = path.dirname(BACKEND_SPEC_PATH);
    const target = path.basename(BACKEND_SPEC_PATH);
    for await (const event of fs.watch(dir)) {
      if (event.filename === target) void this.tick();
    }
  }

  // Drains hash changes in a loop: if the spec was rewritten *during*
  // the current generate, the post-generate re-hash catches it and we
  // run again. Concurrent events arriving while `running` short-circuit
  // here; the loop's tail picks up any net change they represented.
  private async tick(): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      let hash = await hashFile(BACKEND_SPEC_PATH);
      while (hash !== null && hash !== this.lastHash) {
        console.log('🔄 Regenerating API client...');
        try {
          await generate();
          this.lastHash = hash;
          console.log('✅ API client regenerated.');
        } catch (err) {
          // leave lastHash so the next event retries against the complete file.
          console.warn('⚠ regenerate failed; will retry on next change.', err);
          return;
        }
        hash = await hashFile(BACKEND_SPEC_PATH);
      }
    } finally {
      this.running = false;
    }
  }
}

if (isScriptEntrypoint(import.meta.url)) {
  new SpecWatcher().start().catch((err: unknown) => {
    console.error(err);
    process.exit(1);
  });
}
