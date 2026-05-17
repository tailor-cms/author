// Login-specific request middleware: rate limiter + key derivation.
//
// We key the limiter on a sha256 of `<ip>:<email>` so attempts against
// different accounts (or from different IPs) have independent counters
// - an attacker burning down their own (ip, email) counter doesn't
// lock out the legitimate user attempting from another address.
//
// Email casing isn't normalised here; the upstream `processBody`
// middleware in `apps/backend/router.js` lower-cases `req.body.email`
// before any slice middleware runs, so `User1@x` and `user1@x` collapse
// to the same key.
import crypto from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { requestLimiter } from '#shared/request/mw.js';

const ONE_HOUR_IN_MS = 60 * 60 * 1000;

interface LoginRequest extends Request {
  userKey?: string;
}

export const loginRequestLimiter = requestLimiter({
  windowMs: ONE_HOUR_IN_MS,
  limit: 15,
  // `setLoginLimitKey` runs first in the /login `before` chain, so
  // `userKey` is always populated by the time this fires.
  keyGenerator: (req: LoginRequest) => req.userKey!,
});

// Computes a stable per-(ip, email) key for the login limiter and
// stashes it on `req.userKey` for the limiter middleware below.
export function setLoginLimitKey(
  req: LoginRequest,
  _res: Response,
  next: NextFunction,
) {
  const key = [req.ip, req.body?.email].join(':');
  req.userKey = crypto.createHash('sha256').update(key).digest('base64');
  return next();
}

// Wipes the limiter counter for the current key (called after a
// successful login so a user's failed-attempt history doesn't bleed
// into the next session).
export function resetLoginAttempts(
  req: LoginRequest,
  _res: Response,
  next: NextFunction,
) {
  // express-rate-limit types `resetKey` as `void`, but our Keyv-backed
  // store actually returns a Promise. `Promise.resolve(...)` normalises
  // both shapes so we wait for the reset before continuing the chain.
  return Promise.resolve(loginRequestLimiter.resetKey(req.userKey!))
    .then(() => next());
}
