import type { HealthStatus } from '../health.schema.ts';

// The result of running one dependency check.
export interface CheckOutcome {
  // pass = healthy, warn = degraded but usable, fail = broken.
  status: HealthStatus;
  // Optional measurement and its unit, e.g. how long the check took (ms).
  observedValue?: number | string;
  observedUnit?: string;
  // Optional note or error message for this check.
  output?: string;
}

// One dependency the service can check (the database, Redis, storage, ...).
export interface Check {
  // Name this dependency appears under in the health response.
  name: string;
  // What kind of thing it is (e.g. 'datastore', 'component'), shown for context.
  componentType: string;
  // Set for dependencies the app can't run without (the database). If a
  // critical check fails, the whole service reports unhealthy (HTTP 503).
  // Non-critical ones (Redis, storage) only downgrade the report to a
  // warning, because the app still works without them.
  critical: boolean;
  // Run this check on the quick "can we serve traffic?" endpoint
  // (/api/health/ready)? Only critical dependencies do; the full diagnostics
  // endpoint (/api/health/status) runs every check.
  readiness: boolean;
  // Performs the actual check, e.g. SELECT 1 against the database.
  run: () => Promise<CheckOutcome>;
}
