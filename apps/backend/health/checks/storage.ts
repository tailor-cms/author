import storage from '#storage';
import { storage as storageConfig } from '#config';
import type { Check } from './types.ts';

// Critical dependency: object storage is required, so a failure here marks
// the whole service unhealthy (HTTP 503) and counts on the readiness
// probe alongside the database. `healthCheck()` probes bucket reachability
// (S3 HeadBucket / filesystem root writability).
const storageCheck: Check = {
  name: 'storage',
  componentType: 'datastore',
  critical: true,
  readiness: true,
  async run() {
    const start = performance.now();
    await (storage as { healthCheck: () => Promise<unknown> }).healthCheck();
    return {
      status: 'pass',
      observedValue: Math.round(performance.now() - start),
      observedUnit: 'ms',
      output: `provider: ${storageConfig.provider}`,
    };
  },
};

export default storageCheck;
