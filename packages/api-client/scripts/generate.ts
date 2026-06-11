// Orchestrator: end-to-end codegen.
//
//   1. fetch-spec       pull `apps/backend/openapi.json` (the backend's
//                       boot-time snapshot) and normalise the docs-only
//                       tag scheme into `dist/spec.json`.
//   2. @hey-api/openapi-ts
//                       generate axios client + per-operation SDK
//                       functions + types into `dist/generated/`.
//   3. build-namespace  assemble the flat SDK exports into the
//                       `api.<slice>.*` shape and write `dist/api.gen.ts`.
//
// Run with `pnpm generate` from inside `packages/api-client`, or from
// the repo root via `pnpm --filter @tailor-cms/api-client generate`.
import { spawn } from 'node:child_process';
import { buildNamespace } from './build-namespace.ts';
import { fetchSpec } from './fetch-spec.ts';
import { PACKAGE_ROOT, isScriptEntrypoint } from './paths.ts';

interface Step {
  label: string;
  run: () => Promise<unknown>;
}

const runOpenapiTs = (): Promise<void> => new Promise((resolve, reject) => {
  const child = spawn('pnpm', ['exec', 'openapi-ts'], {
    cwd: PACKAGE_ROOT,
    stdio: 'inherit',
  });
  child.once('error', reject);
  child.once('exit', (code) => {
    if (code === 0) resolve();
    else reject(new Error(`openapi-ts exited with code ${code}`));
  });
});

const STEPS: Step[] = [
  { label: 'fetch spec', run: fetchSpec },
  { label: 'openapi-ts', run: runOpenapiTs },
  { label: 'build namespace', run: buildNamespace },
];

export const generate = async (): Promise<void> => {
  for (const step of STEPS) {
    console.log(`\n▶ ${step.label}`);
    await step.run();
  }
  console.log('\n✓ API client generated.');
};

if (isScriptEntrypoint(import.meta.url)) {
  generate().catch((err: unknown) => {
    console.error(err);
    process.exit(1);
  });
}
