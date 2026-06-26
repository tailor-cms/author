// Single source of truth for environment variables.
//
// Every env var the backend reads is declared in the Zod schema below
// and parsed once at module load. Domain config files (ai.ts, auth.ts,
// storage.ts, ...) import `env` from here rather than reading
// `process.env` directly, so the schema is the only place that knows
// the full env surface and the only place coercion or defaults live.
//
// What is intentionally NOT declared:
//   - `TCE_*` plugin-supplied vars. The set is open; see `config/tce.ts`
//     for the prefix-scan that exposes them under `config.tce`.
//   - `NUXT_PUBLIC_*` vars that the frontend consumes
//     (`NUXT_PUBLIC_OIDC_LOGIN_TEXT`, `NUXT_PUBLIC_OIDC_LOGOUT_ENABLED`,
//     `NUXT_PUBLIC_STATSIG_KEY`, ...). The backend ships every
//     `NUXT_PUBLIC_*` key it sees in `process.env` to the FE via the
//     `config` cookie set in `app.ts`;
//   - `DEBUG`, `FORCE_COLOR`.... are Node/tooling conventions consumed by
//     libraries directly (`debug`, supports-color), so they're read from
//     `process.env` where needed, not declared here. `NODE_ENV` *is*
//     declared because the schema and config files branch on it.
import boxen from 'boxen';
import { oneLine } from 'common-tags';
import { UserRole } from '@tailor-cms/interfaces/role';
import { z } from 'zod';
import {
  bool,
  nonNegInt,
  optEmail,
  optInt,
  optRedisUrl,
  optStr,
  optUrl,
  parseUndef,
  posInt,
  reqStr,
  requireAny,
  requireExclusive,
  requireFields,
  requireTogether,
} from './env.utils.ts';

const Shape = z.object({
  // Runtime mode; the schema and several configs branch on it.
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),

  // Public hostname used to build absolute URLs (origin).
  HOSTNAME: z.string().default('localhost'),
  // http|https; inferred from the hostname when unset.
  PROTOCOL: z.enum(['http', 'https']).optional(),
  // HTTP listen port.
  PORT: posInt(3000),
  // External port when behind a reverse proxy (used to build origin URLs).
  // For development Nuxt dev server port, API requests are forwarded to PORT
  REVERSE_PROXY_PORT: optInt(),
  // Express `trust proxy` value: hop count, boolean, or IP/preset string.
  REVERSE_PROXY_TRUST: optStr(),

  // pino log level (`silent` disables logging).
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .default('info'),

  // Database: DATABASE_URI or the individual params below, not both (enforced).
  // Full connection string (postgres://user:pass@host:port/db).
  DATABASE_URI: optUrl(),
  // Param mode: database name (the only required param-mode var).
  DATABASE_NAME: optStr(),
  // Param mode: DB user. When unset, pg uses $PGUSER, else the OS username.
  DATABASE_USER: optStr(),
  // Param mode: DB password. When unset, pg uses $PGPASSWORD, else none.
  DATABASE_PASSWORD: optStr(),
  // Param mode: host.
  DATABASE_HOST: z.string().default('localhost'),
  // Param mode: port.
  DATABASE_PORT: posInt(5432),
  // Sequelize dialect.
  DATABASE_ADAPTER: z.string().default('postgres'),
  // Param mode: enable TLS (URI mode encodes SSL in the connection string).
  DATABASE_SSL: bool.default(false),
  // Skip auto-migrate on boot (migrations run by default).
  DATABASE_DISABLE_MIGRATIONS_ON_STARTUP: bool.default(false),

  // Auth (local email/password login).
  // Password-hashing cost: bcrypt rounds used when storing user passwords.
  AUTH_SALT_ROUNDS: posInt(10),
  // Required (min 8 chars): signs & verifies the login token (JWT)
  AUTH_JWT_SECRET: reqStr(8),
  // Optional `issuer` label stamped into tokens and checked on verify.
  AUTH_JWT_ISSUER: optStr(),
  // Name of the cookie that stores the login token.
  AUTH_JWT_COOKIE_NAME: z.string().default('access_token'),
  // HMAC key cookie-parser uses to sign the auth cookie value (`s:<jwt>.<sig>`)
  // and verify it per request, so a tampered cookie is rejected before the JWT
  // is parsed. Distinct from AUTH_JWT_SECRET (signs the token); unset = unsigned.
  AUTH_JWT_COOKIE_SECRET: optStr(),
  // Browser origins allowed to call the API (comma-separated); '' = same-origin.
  CORS_ALLOWED_ORIGINS: z.string().default(''),

  // OIDC: single sign-on via an external identity provider (Google, Okta,
  // Azure AD, ...). The flag is also read by the frontend; the credentials
  // and session secret below are required when it's enabled.
  NUXT_PUBLIC_OIDC_ENABLED: bool.default(false),
  // Credentials your app was registered with at the identity provider.
  OIDC_CLIENT_ID: optStr(),
  OIDC_CLIENT_SECRET: optStr(),
  // Provider base URL; the app auto-discovers its endpoints/keys from here.
  OIDC_ISSUER: optUrl(),
  // URL of the provider's public signing keys (used to verify ID tokens).
  OIDC_JWKS_URL: optUrl(),
  // Specific provider URLs - set only to override what discovery returns.
  OIDC_AUTHORIZATION_ENDPOINT: optUrl(),
  OIDC_TOKEN_ENDPOINT: optUrl(),
  OIDC_USERINFO_ENDPOINT: optUrl(),
  OIDC_LOGOUT_ENDPOINT: optUrl(),
  // Query-param name the provider expects for the post-logout return URL.
  OIDC_POST_LOGOUT_URI_KEY: optStr(),
  // Auto-create a local account the first time someone logs in via SSO.
  OIDC_ALLOW_SIGNUP: bool.default(false),
  // Role for auto-created SSO users - one of USER, ADMIN, COLLABORATOR,
  // INTEGRATION; defaults to USER.
  OIDC_DEFAULT_ROLE: z.preprocess(
    parseUndef,
    z.enum(UserRole).default(UserRole.USER),
  ),
  // Secret signing the server session during the SSO login handshake.
  OIDC_SESSION_SECRET: optStr(),

  // AI (OpenAI) config. Enabled when AI_SECRET_KEY is set; the model defaults.
  // Show the AI authoring UI on the frontend.
  NUXT_PUBLIC_AI_UI_ENABLED: bool.default(false),
  // OpenAI API key (enables AI features when set).
  AI_SECRET_KEY: optStr(),
  // Chat/completion model id.
  AI_MODEL_ID: z.string().default('gpt-5.4-mini'),
  // Model used for image generation/editing.
  AI_IMAGE_MODEL_ID: z.string().default('gpt-image-2'),
  // Days of inactivity before an AI vector store is cleaned up.
  AI_VECTOR_STORE_EXPIRY_DAYS: posInt(60),

  // Asset storage backend. `amazon` (S3) requires the credentials below.
  STORAGE_PROVIDER: z.enum(['filesystem', 'amazon']).default('filesystem'),
  // filesystem provider only: local directory assets are stored in.
  STORAGE_PATH: optStr(),
  // amazon (S3) provider: access key / secret / region / bucket.
  STORAGE_KEY: optStr(),
  STORAGE_SECRET: optStr(),
  STORAGE_REGION: optStr(),
  STORAGE_BUCKET: optStr(),
  // Custom S3-compatible endpoint (MinIO, Cloudflare R2, ...); omit for AWS.
  STORAGE_ENDPOINT: optUrl(),
  // Lifetime of presigned asset URLs (image previews / downloads), in seconds.
  // Default 1 day; SigV4 allows up to 7 days.
  STORAGE_SIGNED_URL_TTL: posInt(24 * 60 * 60),
  // Max asset-library upload size, in BYTES (default 1 GiB). NUXT_PUBLIC_ so the
  // frontend receives it via the config cookie and can reject oversized files
  // before uploading; the backend uses the same value for the multer limit.
  NUXT_PUBLIC_STORAGE_MAX_UPLOAD_SIZE: posInt(1024 * 1024 * 1024),

  // Outgoing email (SMTP), used for invites, password resets, etc.
  // SMTP server hostname.
  EMAIL_HOST: optStr(),
  // SMTP login username / password.
  EMAIL_USER: optStr(),
  EMAIL_PASSWORD: optStr(),
  // SMTP port; left unset, emailjs picks it from ssl/tls (465/587/25).
  EMAIL_PORT: optInt(),
  // Connect over implicit TLS (usually port 465).
  EMAIL_SSL: bool.default(false),
  // Upgrade to TLS via STARTTLS (usually port 587).
  EMAIL_TLS: bool.default(false),
  // Display name shown in the From header.
  EMAIL_SENDER_NAME: z.string().default('Tailor'),
  // Address shown in the From header.
  EMAIL_SENDER_ADDRESS: optEmail(),

  // Key-value store (Redis) backing SSE, rate-limiting and caching;
  // falls back to in-memory when unset.
  KV_STORE_URL: optRedisUrl(),
  // Default key time-to-live in milliseconds (0 = never expire).
  KV_STORE_DEFAULT_TTL: nonNegInt(0),

  // Webhooks that notify an external "consumer" app about publishing.
  // The CONSUMER_CLIENT_* OAuth2 set is all-or-none (enforced below).
  // URL pinged to publish a preview of content.
  CONSUMER_PREVIEW_WEBHOOK: optUrl(),
  // URL pinged to publish content.
  CONSUMER_PUBLISH_WEBHOOK: optUrl(),
  // Minimum delay between publish webhook calls (throttle).
  CONSUMER_PUBLISH_WEBHOOK_THROTTLE: nonNegInt(0),
  // URL pinged when a repository's access list changes.
  CONSUMER_ACCESS_UPDATE_WEBHOOK: optUrl(),
  // OAuth2 client credentials used to authenticate the webhook calls.
  CONSUMER_CLIENT_ID: optStr(),
  CONSUMER_CLIENT_SECRET: optStr(),
  CONSUMER_CLIENT_TOKEN_HOST: optUrl(),
  CONSUMER_CLIENT_TOKEN_PATH: optStr(),

  // Asset discovery: find images/links via external search APIs.
  // Enable the asset-discovery feature.
  NUXT_PUBLIC_DISCOVERY_ENABLED: bool.default(false),
  // Serper web-search API (only active when SERPER_API_KEY is set; timeout ms).
  SERPER_API_URL: z.url().default('https://google.serper.dev'),
  SERPER_API_KEY: z.string().default(''),
  SERPER_TIMEOUT: posInt(10000),
  // Unsplash image-search API (only active when UNSPLASH_ACCESS_KEY is set).
  UNSPLASH_API_URL: z.url().default('https://api.unsplash.com'),
  UNSPLASH_ACCESS_KEY: z.string().default(''),
  UNSPLASH_TIMEOUT: posInt(10000),
  // Jina reader (fetches a URL and returns clean text); endpoint + timeout ms.
  JINA_READER_URL: z.url().default('https://r.jina.ai'),
  JINA_READER_TIMEOUT: posInt(15000),
  // open-graph-scraper fetch timeout in ms.
  OGS_TIMEOUT: posInt(5000),

  // Misc feature flags (NUXT_PUBLIC_* are read on both FE and BE).
  // Use a flat publishing/repository structure.
  FLAT_REPO_STRUCTURE: bool.default(false),
  // Enable API rate limiting (backed by the KV store).
  ENABLE_RATE_LIMITING: bool.default(false),
  // Allow fetching localhost/private-IP URLs; disables SSRF guard (dev only).
  // (e.g. 127.x, 10.x, 192.168.x) in asset link imports. Enable for local development only.
  ALLOW_PRIVATE_URLS: bool.default(false),
  // Comma-separated allowlist of schema ids to expose (empty = all).
  NUXT_PUBLIC_AVAILABLE_SCHEMAS: optStr(),
  // Expose test-only seed/reset API endpoints.
  ENABLE_TEST_API_ENDPOINTS: bool.default(false),
});

type Vars = z.infer<typeof Shape>;

function enforceInvariants(values: Vars, ctx: z.RefinementCtx) {
  requireAny(ctx, {
    values,
    anyOf: ['DATABASE_URI', 'DATABASE_NAME'],
    message: oneLine`
      Set DATABASE_URI (postgres://...), or DATABASE_NAME for the
      individual-parameter form (host/port default to localhost:5432;
      user/password fall back to libpq).
    `,
    path: 'DATABASE_NAME',
  });

  requireExclusive(ctx, {
    values,
    key: 'DATABASE_URI',
    excludes: ['DATABASE_NAME', 'DATABASE_USER', 'DATABASE_PASSWORD'],
    message:
      'Use either DATABASE_URI or the individual DATABASE_* params, not both.',
  });

  requireFields(ctx, {
    when: values.STORAGE_PROVIDER === 'amazon',
    label: 'STORAGE_PROVIDER=amazon',
    path: 'STORAGE_PROVIDER',
    values,
    required: [
      'STORAGE_KEY',
      'STORAGE_SECRET',
      'STORAGE_BUCKET',
      'STORAGE_REGION',
    ],
  });

  requireFields(ctx, {
    when: values.NUXT_PUBLIC_OIDC_ENABLED,
    label: 'NUXT_PUBLIC_OIDC_ENABLED=true',
    path: 'NUXT_PUBLIC_OIDC_ENABLED',
    values,
    required: [
      'OIDC_CLIENT_ID',
      'OIDC_CLIENT_SECRET',
      'OIDC_ISSUER',
      'OIDC_SESSION_SECRET',
    ],
  });

  requireTogether(ctx, {
    values,
    keys: [
      'CONSUMER_CLIENT_ID',
      'CONSUMER_CLIENT_SECRET',
      'CONSUMER_CLIENT_TOKEN_HOST',
      'CONSUMER_CLIENT_TOKEN_PATH',
    ],
    message: oneLine`
      CONSUMER_CLIENT_* settings are partial: provide all four of
      CONSUMER_CLIENT_ID, CONSUMER_CLIENT_SECRET, CONSUMER_CLIENT_TOKEN_HOST,
      CONSUMER_CLIENT_TOKEN_PATH, or none.
    `,
  });
}

const Schema = Shape.superRefine(enforceInvariants);

const parsed = Schema.safeParse(process.env);

if (!parsed.success) {
  // List every offending var at once (keyed by name) instead of failing on
  // the first.
  const issues = parsed.error.issues
    .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
    .join('\n');
  const command = 'pnpm setup:dev';
  const setupHint =
    process.env.NODE_ENV === 'production'
      ? ''
      : `\n\nSetting up for development? Scaffold your .env with:\n  ${command}`;
  console.error(
    boxen(`Invalid environment configuration:\n\n${issues}${setupHint}`, {
      title: 'Tailor CMS',
      titleAlignment: 'center',
      borderColor: 'red',
      borderStyle: 'round',
      padding: 1,
      margin: 1,
    }),
  );
  throw new Error('Environment validation failed');
}

export const env = parsed.data;
export type Env = z.infer<typeof Schema>;
