import { createLogger } from '#logger';

const logger = createLogger('audit');

// Failures log at `warn` so they stand out: failed logins and denied
// access are the early signal of an attack. Successes keep an `info`
// paper trail.
const levels = { success: 'info', failure: 'warn' } as const;

type Outcome = keyof typeof levels;

/**
 * Security audit trail: one line per security-relevant event - logins,
 * password changes, denied access, user administration (the events OWASP
 * says an app must record). Lines are tagged `audit: true` so a log
 * pipeline can filter, alert on, or retain them separately from app logs:
 *
 *   audit('auth:login', 'failure', { email, ip });
 *   -> {"audit":true,"event":"auth:login","outcome":"failure",...}
 *
 * Pass identifiers only (ids, email, ip) - never passwords or tokens.
 */
export const audit = (
  event: string,
  outcome: Outcome,
  data: Record<string, unknown> = {},
) => {
  const entry = { audit: true, event, outcome, ...data };
  logger[levels[outcome]](entry, `${event} ${outcome}`);
};
