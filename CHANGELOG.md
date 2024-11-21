# Changelog

## v7.1

#### Changes
- Migrated schemas to `@tailor-cms/config` package, located in the `./config`
  dir. Schemas are now defined using TypeScript.

## v7.0

#### Changes
- Added the ability to turn off rate limiting via the `ENABLE_RATE_LIMITING`
  environment variable. See `.env.example` for more details.
- Updated Key-Value store configuration. See `.env.example` for more details.
- Updated healthcheck route to `/api/healthcheck`
- Prefixed `OIDC_ENABLED`, `OIDC_LOGIN_TEXT` and `OIDC_LOGOUT_ENABLED` env 
  variables `NUXT_PUBLIC_`
- prefixed `SESSION_SECRET` with `OIDC_`
