// Response shapes for the health endpoints. They follow the common
// `application/health+json` convention: a top-level `status`, plus a `checks`
// map with one entry per dependency.
import { z } from 'zod';

// pass = healthy, warn = degraded but usable, fail = broken.
export const HealthStatus = z.enum(['pass', 'warn', 'fail']);
export type HealthStatus = z.infer<typeof HealthStatus>;

// One dependency's result in the report. `observedValue`/`observedUnit` are
// an optional measurement (e.g. response time in ms); `output` is a note or
// error message.
export const CheckResult = z.object({
  status: HealthStatus,
  componentType: z.string().optional(),
  observedValue: z.union([z.number(), z.string()]).optional(),
  observedUnit: z.string().optional(),
  output: z.string().optional(),
  time: z.string(),
});

export type CheckResult = z.infer<typeof CheckResult>;

export const HealthReport = z.object({
  status: HealthStatus,
  // Service name and version info
  serviceId: z.string().optional(),
  releaseId: z.string().optional(),
  version: z.string().optional(),
  description: z.string().optional(),
  time: z.string(),
  checks: z.record(z.string(), CheckResult).optional(),
});

export type HealthReport = z.infer<typeof HealthReport>;

// The tiny payload from /api/healthcheck and /health/live: just "is the
// process up?", no dependencies touched. Uses the health+json `pass` status
// for consistency with the readiness/diagnostics reports.
export const LivenessResponse = z.object({
  status: z.literal('pass'),
  uptime: z.number(),
  time: z.string(),
});

export type LivenessResponse = z.infer<typeof LivenessResponse>;
