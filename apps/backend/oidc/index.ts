// OIDC slice; redirect-based auth flow.
//
// OIDC's request/response model is fundamentally a chain of passport
// middlewares (`authenticate(...)`, `logout()`) that own the `(req, res,
// next)` triple and end with `res.redirect(...)`
//
// IdP callback query shape (parsed by passport, NOT by this slice):
//   - `code`, `state`, `iss`, `session_state`; standard OIDC code-flow
//     fields (RFC 6749 §4.1.2 + OIDC Core 1.0)
//   - `error`, `error_description`, `error_uri`; OIDC error response
//     (RFC 6749 §4.1.2.1)
//   - `action=logout`; our own marker on logout round-trips, branched
//     on by `idpCallbackHandler` below.
// Vendor-specific extras may also be present; openid-client tolerates them.
import type { NextFunction, Request, Response } from 'express';
import express from 'express';
import { errors as OIDCError } from 'openid-client';

import type { AuthQuery } from './schemas/index.ts';
import auth from '#shared/auth/index.js';
import { requestLimiter } from '#shared/request/mw.js';
import { origin } from '#config';

const router = express.Router();
const { authenticate, logout } = auth;

const ACCESS_DENIED_ROUTE = `${origin}/auth?accessDenied=`;

const OIDCErrors: ReadonlyArray<new (...args: any[]) => Error> = [
  OIDCError.OPError,
  OIDCError.RPError,
];
const scope = ['openid', 'profile', 'email'].join(' ');

const asAuthQuery = (req: Request) => req.query as unknown as AuthQuery;
const isResign = (req: Request) => asAuthQuery(req).resign === 'true';

const isLogoutRequest = (req: Request) =>
  asAuthQuery(req).action === 'logout';

const getPromptParams = (req: Request) =>
  isResign(req) ? { prompt: 'login' } : {};

const isOIDCError = (err: unknown): err is Error =>
  OIDCErrors.some((Ctor) => err instanceof Ctor);

router
  .use(requestLimiter())
  .get('/', authRequestHandler)
  .get('/callback', idpCallbackHandler, (_req, res) => res.redirect(origin))
  .use(accessDeniedHandler);

export default {
  path: '/oidc',
  router,
};

// Entry: initiate login (or trigger IdP logout when `?action=logout`).
function authRequestHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const strategy = (req as any).passport.strategy('oidc');
  if (isLogoutRequest(req)) return strategy.logout()(req, res, next);
  const params = {
    session: true,
    scope,
    ...getPromptParams(req),
  };
  return authenticate('oidc', params)(req, res, next);
}

// IdP callback: finalise login, or finish the logout round-trip.
function idpCallbackHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!isLogoutRequest(req)) return login(req, res, next);
  return logout({ middleware: true })(req, res, next);
}

// Error tail: redirect rejected users to the FE with their email so the
// UI can render an "access denied" message; bubble real OIDC protocol
// errors through to the global handler.
function accessDeniedHandler(
  err: unknown,
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!isOIDCError(err)) {
    const email = (err as { email?: string })?.email ?? '';
    return res.redirect(ACCESS_DENIED_ROUTE + email);
  }
  return next(err);
}

function login(req: Request, res: Response, next: NextFunction) {
  const params = { session: true, setCookie: true };
  authenticate('oidc', params)(req, res, (err: unknown) =>
    err ? next(err) : res.redirect(origin),
  );
}
