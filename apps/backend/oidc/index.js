import express from 'express';
import { errors as OIDCError } from 'openid-client';
import auth from '../shared/auth/index.js';

import { origin } from '../config/server/index.js';
import { requestLimiter } from '../shared/request/mw.js';

const router = express.Router();
const { authenticate, logout } = auth;

const ACCESS_DENIED_ROUTE = `${origin}/auth?accessDenied=`;

const OIDCErrors = [OIDCError.OPError, OIDCError.RPError];
const scope = ['openid', 'profile', 'email'].join(' ');

const isResign = ({ query }) => query.resign === 'true';
const isLogoutRequest = ({ query }) => query.action === 'logout';
const getPromptParams = (req) => (isResign(req) ? { prompt: 'login' } : {});

const isOIDCError = (err) => OIDCErrors.some((Ctor) => err instanceof Ctor);

router
  .use(requestLimiter())
  .get('/', authRequestHandler)
  .get('/callback', idpCallbackHandler, (_, res) => res.redirect(origin))
  .use(accessDeniedHandler);

export default {
  path: '/oidc',
  router,
};

// Initiate login and logout actions
function authRequestHandler(req, res, next) {
  const strategy = req.passport.strategy('oidc');
  if (isLogoutRequest(req)) return strategy.logout()(req, res, next);
  const params = {
    session: true,
    scope,
    ...getPromptParams(req),
  };
  return authenticate('oidc', params)(req, res, next);
}

// Triggered upon OIDC provider response
function idpCallbackHandler(req, res, next) {
  if (!isLogoutRequest(req)) return login(req, res, next);
  return logout({ middleware: true })(req, res, next);
}

function accessDeniedHandler(err, _req, res, next) {
  if (!isOIDCError(err)) return res.redirect(ACCESS_DENIED_ROUTE + err.email);
  return next(err);
}

function login(req, res, next) {
  const params = { session: true, setCookie: true };
  authenticate('oidc', params)(req, res, (err) =>
    err ? next(err) : res.redirect(origin),
  );
}
