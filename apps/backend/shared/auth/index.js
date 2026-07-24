import path from 'node:path';
import { ExtractJwt, Strategy as JwtStrategy } from 'passport-jwt';
import get from 'lodash/get.js';
import jwt from 'jsonwebtoken';
import LocalStrategy from 'passport-local';
import db from '../database/index.js';
import Audience from './audience.js';
import auth from './authenticator.js';
import OIDCStrategy from './oidc.js';
import { audit } from '../audit.ts';
import { auth as config, origin } from '#config';

const { User } = db;

// Failed logins are audited here - the strategy is the only place that
// sees the credential check. We log who and from where, never whether the
// email or the password was at fault. `passReqToCallback` is on solely to
// reach `req.ip`.
auth.use(
  new LocalStrategy({
    usernameField: 'email',
    passReqToCallback: true,
    session: false,
  }, (req, email, password, done) => {
    return User.scope('withGroups')
      .findOne({ where: { email } })
      .then((user) => user && user.authenticate(password))
      .then((user) => {
        if (!user) {
          audit('auth:login', 'failure', {
            strategy: 'local',
            email,
            ip: req.ip,
          });
        }
        return done(null, user || false);
      })
      .error((err) => done(err, false));
  }),
);

auth.use(
  new JwtStrategy(
    {
      ...config.jwt,
      audience: Audience.Scope.Access,
      jwtFromRequest: ExtractJwt.fromExtractors([
        extractJwtFromCookie,
        ExtractJwt.fromBodyField('token'),
      ]),
      secretOrKey: config.jwt.secret,
    },
    verifyJWT,
  ),
);

auth.use(
  'token',
  new JwtStrategy(
    {
      ...config.jwt,
      audience: Audience.Scope.Setup,
      jwtFromRequest: ExtractJwt.fromBodyField('token'),
      secretOrKeyProvider,
    },
    verifyJWT,
  ),
);

config.oidc.enabled &&
  auth.use(
    'oidc',
    new OIDCStrategy(
      {
        ...config.oidc,
        callbackURL: apiUrl('/oidc/callback'),
      },
      verifyOIDC,
    ),
  );

auth.serializeUser((user, done) => done(null, user));
auth.deserializeUser((user, done) => done(null, user));

export default auth;

function verifyJWT(payload, done) {
  return User.scope('withGroups')
    .findByPk(payload.id)
    .then((user) => done(null, user || false))
    .error((err) => done(err, false));
}

// OIDC logins are audited here (both outcomes) - the identity provider
// callback is the only step that knows whether sign-in succeeded.
function verifyOIDC(tokenSet, profile, done) {
  return findOrCreateOIDCUser(profile)
    .then((user) => {
      user.authData = { tokenSet };
      audit('auth:login', 'success', {
        strategy: 'oidc',
        userId: user.id,
        email: user.email,
      });
      done(null, user);
    })
    .catch((err) => {
      audit('auth:login', 'failure', {
        strategy: 'oidc',
        email: profile.email,
      });
      done(Object.assign(err, { email: profile.email }), false);
    });
}

function extractJwtFromCookie(req) {
  const path = config.jwt.cookie.signed ? 'signedCookies' : 'cookies';
  return get(req[path], config.jwt.cookie.name, null);
}

function secretOrKeyProvider(_, rawToken, done) {
  const { id } = jwt.decode(rawToken) || {};
  return User.scope('withGroups')
    .findByPk(id, { rejectOnEmpty: true })
    .then((user) => user.getTokenSecret())
    .then((secret) => done(null, secret))
    .catch((err) => done(err));
}

function apiUrl(pathname) {
  return new URL(path.join('/api', pathname), origin).href;
}

function findOrCreateOIDCUser({ email, firstName, lastName }) {
  if (!config.oidc.enableSignup) {
    return User.scope('withGroups').findOne({
      where: { email },
      rejectOnEmpty: true,
    });
  }
  const defaults = { firstName, lastName, role: config.oidc.defaultRole };
  return User.scope('withGroups').findOrCreate({
    where: { email },
    defaults,
  }).then(([user]) => user);
}
