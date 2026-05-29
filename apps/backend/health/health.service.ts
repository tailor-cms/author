import type {
  CheckResult,
  HealthReport,
  HealthStatus,
} from './health.schema.ts';
import { checks as allChecks, type Check } from './checks/index.ts';
import { packageName, packageVersion } from '#config';

// Per-check ceiling. Keeps a wedged dependency from hanging the probe and,
// in turn, the orchestrator's view of the service.
const CHECK_TIMEOUT_MS = 2500;

// The deep report is cached briefly so a burst of monitor hits (or a manual
// refresh) doesn't fan out a probe to every dependency each time.
const FULL_REPORT_TTL_MS = 5000;

const SERVICE_ID = packageName ?? 'tailor-server';
const RELEASE_ID = packageVersion;
const VERSION = packageVersion?.split('.')[0];
const DESCRIPTION = 'Tailor CMS authoring backend';

let cached: { at: number; report: HealthReport } | undefined;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`timed out after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

async function runCheck(check: Check): Promise<CheckResult> {
  const time = new Date().toISOString();
  try {
    const outcome = await withTimeout(check.run(), CHECK_TIMEOUT_MS);
    return { componentType: check.componentType, time, ...outcome };
  } catch (err) {
    return {
      // A soft check that errors degrades to `warn`; only critical checks
      // escalate to `fail`.
      status: check.critical ? 'fail' : 'warn',
      componentType: check.componentType,
      time,
      output: err instanceof Error ? err.message : 'check failed',
    };
  }
}

function aggregate(
  results: { check: Check; result: CheckResult }[],
): HealthStatus {
  let status: HealthStatus = 'pass';
  for (const { check, result } of results) {
    if (result.status === 'pass') continue;
    if (check.critical && result.status === 'fail') return 'fail';
    status = 'warn';
  }
  return status;
}

/**
 * Runs the dependency checks and assembles an `application/health+json`
 * report. `ready` runs only critical checks (cheap, no caching); `full`
 * runs every check and is briefly cached.
 */
export async function buildReport(
  scope: 'ready' | 'full',
): Promise<HealthReport> {
  if (
    scope === 'full' &&
    cached &&
    Date.now() - cached.at < FULL_REPORT_TTL_MS
  ) {
    return cached.report;
  }
  const selected = allChecks.filter((c) =>
    scope === 'ready' ? c.readiness : true,
  );
  const settled = await Promise.all(
    selected.map(async (check) => ({ check, result: await runCheck(check) })),
  );
  const checks: Record<string, CheckResult> = {};
  for (const { check, result } of settled) checks[check.name] = result;
  const report: HealthReport = {
    serviceId: SERVICE_ID,
    status: aggregate(settled),
    version: VERSION,
    releaseId: RELEASE_ID,
    description: DESCRIPTION,
    time: new Date().toISOString(),
    checks,
  };
  if (scope === 'full') cached = { at: Date.now(), report };
  return report;
}

export function httpStatusFor(status: HealthStatus): number {
  return status === 'fail' ? 503 : 200;
}
