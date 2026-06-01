import { kvStore } from '#config';
import { createKvStore } from '#shared/kvStore.ts';
import type { Check } from './types.ts';

const PROBE_KEY = 'health:probe';

// Reuses the shared KeyvRedis store from config (no new connection).
const probe = kvStore.store ? createKvStore<number>() : undefined;

// Soft dependency
const kv: Check = {
  name: 'kv-store',
  componentType: 'datastore',
  critical: false,
  readiness: false,
  async run() {
    if (!probe) {
      return {
        status: 'pass',
        output: 'in-memory (no external store configured)',
      };
    }
    const start = performance.now();
    await probe.set(PROBE_KEY, Date.now(), 5000);
    await probe.get(PROBE_KEY);
    return {
      status: 'pass',
      observedValue: Math.round(performance.now() - start),
      observedUnit: 'ms',
    };
  },
};

export default kv;
