import type { CheckResult } from '../health.schema.ts';

// What a single check's run() returns
export type CheckOutcome = Omit<CheckResult, 'componentType' | 'time'>;

// One dependency the service can check (the database, storage, Redis, ...).
export interface Check {
  // Name this dependency appears under in the health response.
  name: string;
  // What kind of thing it is (e.g. 'datastore', 'component'), shown for context.
  componentType: string;
  // Set for dependencies the app can't run without (the database, storage).
  // If a critical check fails, the whole service reports unhealthy (HTTP
  // 503). Non-critical ones downgrade the report to a warning,
  // because the app still works without them.
  critical: boolean;
  // Run this check on the quick "can we serve traffic?" endpoint
  // (/api/health/ready)? Only critical dependencies do
  readiness: boolean;
  // Performs the actual check, e.g. SELECT 1 against the database.
  run: () => Promise<CheckOutcome>;
}
