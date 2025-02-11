import path from 'node:path';
import { ExtractJwt, Strategy as JwtStrategy } from 'passport-jwt';
import get from 'lodash/get.js';
import jwt from 'jsonwebtoken';
import LocalStrategy from 'passport-local';
import db from '../database/index.js';
import Audience from './audience.js';
import auth from './authenticator.js';
import OIDCStrategy from './oidc.js';
import { auth as config, origin } from '#config';

const { User, UserGroup, UserGroupMember } = db;
const loadUserOptions = { include: [{ model: UserGroup }, { model: UserGroupMember }] };

auth.use(
  new LocalStrategy({
    usernameField: 'email',
    session: false,
  }, (email, password, done) => {
    return User.unscoped()
      .findOne({ where: { email }, ...loadUserOptions })
      .then((user) => user && user.authenticate(password))
      .then((user) => done(null, user || false))
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
  return User.unscoped()
    .findByPk(payload.id, { ...loadUserOptions })
    .then((user) => done(null, user || false))
    .error((err) => done(err, false));
}

function verifyOIDC(tokenSet, profile, done) {
  return findOrCreateOIDCUser(profile)
    .then((user) => {
      user.authData = { tokenSet };
      done(null, user);
    })
    .catch((err) => done(Object.assign(err, { email: profile.email }), false));
}

function extractJwtFromCookie(req) {
  const path = config.jwt.cookie.signed ? 'signedCookies' : 'cookies';
  return get(req[path], config.jwt.cookie.name, null);
}

function secretOrKeyProvider(_, rawToken, done) {
  const { id } = jwt.decode(rawToken) || {};
  return User.unscoped()
    .findByPk(id, { ...loadUserOptions, rejectOnEmpty: true })
    .then((user) => user.getTokenSecret())
    .then((secret) => done(null, secret))
    .catch((err) => done(err));
}

function apiUrl(pathname) {
  return new URL(path.join('/api', pathname), origin).href;
}

function findOrCreateOIDCUser({ email, firstName, lastName }) {
  if (!config.oidc.enableSignup) {
    return User.findOne({
      where: { email },
      ...loadUserOptions,
      rejectOnEmpty: true,
    });
  }
  const defaults = { firstName, lastName, role: config.oidc.defaultRole };
  return User.findOrCreate({
    where: { email },
    ...loadUserOptions,
    defaults,
  }).then(([user]) => user);
}
