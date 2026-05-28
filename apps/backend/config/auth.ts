import { env } from './env.ts';

export const corsAllowedOrigins = env.CORS_ALLOWED_ORIGINS.split(',')
  .map((s) => s.trim())
  .filter((s) => s);

export const saltRounds = env.AUTH_SALT_ROUNDS;

export const jwt = {
  cookie: {
    name: env.AUTH_JWT_COOKIE_NAME,
    secret: env.AUTH_JWT_COOKIE_SECRET,
    signed: !!env.AUTH_JWT_COOKIE_SECRET,
    secure: env.PROTOCOL === 'https' && env.HOSTNAME !== 'localhost',
    httpOnly: true,
  },
  issuer: env.AUTH_JWT_ISSUER,
  secret: env.AUTH_JWT_SECRET,
};

export const oidc = {
  enabled: env.NUXT_PUBLIC_OIDC_ENABLED,
  clientID: env.OIDC_CLIENT_ID,
  clientSecret: env.OIDC_CLIENT_SECRET,
  issuer: env.OIDC_ISSUER,
  jwksURL: env.OIDC_JWKS_URL,
  authorizationEndpoint: env.OIDC_AUTHORIZATION_ENDPOINT,
  tokenEndpoint: env.OIDC_TOKEN_ENDPOINT,
  userInfoEndpoint: env.OIDC_USERINFO_ENDPOINT,
  logoutEndpoint: env.OIDC_LOGOUT_ENDPOINT,
  postLogoutUriKey: env.OIDC_POST_LOGOUT_URI_KEY,
  enableSignup: env.OIDC_ALLOW_SIGNUP,
  defaultRole: env.OIDC_DEFAULT_ROLE,
};

export const session = {
  secret: env.OIDC_SESSION_SECRET,
  proxy: true,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false },
};
