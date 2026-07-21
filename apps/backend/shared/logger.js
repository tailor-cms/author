import { AsyncLocalStorage } from 'node:async_hooks';
import { Chalk } from 'chalk';
import { randomUUID } from 'node:crypto';
import pino from 'pino';
import pinoHttp from 'pino-http';
import pretty from 'pino-pretty';

import { isProduction } from '#config/runtime.ts';
import { logLevel } from '#config/logger.ts';

// At debug/trace, request logs carry full detail (headers, query - still
// redacted); at info+ they collapse to a one-line summary. Decided once from
// the level, since serializers and pretty format are fixed at logger creation.
const isVerbose = logLevel === 'debug' || logLevel === 'trace';

/**
 * Dev pretty-prints through a synchronous in-process stream rather than a
 * worker-thread transport: a worker (or async stream) flushes on its own
 * schedule, so its lines race behind direct stdout writes such as the boot
 * banner, and separate logger instances race against each other. `sync: true`
 * writes each line to stdout in call order. Unless verbose, `ignore` drops the
 * structured req/res/responseTime/reqId fields so requests collapse to one
 * summary line; production always emits them as JSON for aggregation.
 */
const prettyStream = () =>
  pretty({
    colorize: true,
    sync: true,
    ignore: isVerbose
      ? 'hostname,pid'
      : 'hostname,pid,reqId,req,res,responseTime',
  });

// Attach the dev pretty stream outside production; production logs raw JSON.
const instantiate = (factory, options) =>
  isProduction ? factory(options) : factory(options, prettyStream());

/**
 * Whitelisting error serializer. pino's default serializes every enumerable
 * property of an error, and Sequelize's `DatabaseError` carries `sql`,
 * `parameters` (the bound query values - e.g. a user row's bcrypt hash) and
 * the raw driver error under `parent`/`original`. We keep only the diagnostic
 * fields so those payloads never reach the logs, at any level.
 */
const errSerializer = (err) => ({
  type: err?.name,
  message: err?.message,
  stack: err?.stack,
  status: err?.status,
  code: err?.code,
});

/**
 * Per-request context, readable from anywhere on the request's async call
 * chain. `bindRequestContext` below fills it with the request id; the
 * `mixin` stamps it onto every line a module logger writes while handling
 * that request. So when e.g. `asset:svc` logs an error, the line carries
 * `reqId` and can be matched to the exact request that triggered it - no
 * need to pass the id around by hand.
 */
const requestContext = new AsyncLocalStorage();

export const createLogger = (name) =>
  instantiate(pino, {
    name,
    level: logLevel,
    serializers: { err: errSerializer },
    // Copy, don't hand out the store itself: pino merges the log call's
    // fields into the object the mixin returns, so returning the shared
    // store would let one line's fields bleed into every later line of
    // the same request.
    mixin: () => ({ ...requestContext.getStore() }),
  });

// Starts the per-request context, so logs made anywhere during this
// request can include its id.
export const bindRequestContext = (req, _res, next) =>
  requestContext.run({ reqId: req.id }, next);

// Query-string keys that can carry credentials or one-time tokens (e.g. the
// OIDC callback's `code`/`state`, which the identity provider appends to the
// redirect). Their values are masked before logging, mirroring the header
// `redact` config below, since the full request URL is logged.
const SENSITIVE_QUERY_KEYS = [
  'code',
  'state',
  'session_state',
  'token',
  'id_token',
  'access_token',
  'refresh_token',
  'code_verifier',
];
const sensitiveQuery = new RegExp(
  `([?&](?:${SENSITIVE_QUERY_KEYS.join('|')})=)[^&]*`,
  'gi',
);

// The logger is mounted on `/api`, so Express strips that prefix from
// `req.url`; `originalUrl` keeps the full request path in the logs. Sensitive
// query values are masked so tokens in the URL never reach the logs.
const fullUrl = (req) =>
  (req.originalUrl ?? req.url).replace(sensitiveQuery, '$1[redacted]');

const requestSummary = (req, res, detail) =>
  `${req.method} ${fullUrl(req)} ${res.statusCode} (${detail})`;

// Colour the response time by how slow it was, so a slow request stands
// out while scanning the dev console. Skipped in production, where output
// is raw JSON and never read as coloured text.
const chalk = new Chalk({ level: 3 });
const FAST_MS = 30;
const MODERATE_MS = 50;

const colorizeDuration = (responseTime) => {
  const text = `${responseTime}ms`;
  if (isProduction) return text;
  if (responseTime < FAST_MS) return chalk.green(text);
  if (responseTime < MODERATE_MS) return chalk.yellow(text);
  return chalk.red(text);
};

/**
 * HTTP request logging, shared by prod (JSON) and dev (pretty). Each request
 * logs one concise summary line; "GET /api/users 200 (4ms)" - the dev-server
 * convention (morgan `dev`, Rails, Fastify), so a normal `info` session shows
 * request activity without a header dump; debug/trace adds the full req/res
 * detail. Level follows the outcome: 5xx / thrown errors -> error, 4xx ->
 * warn, otherwise info. `redact` is a defence-in-depth net so auth cookies /
 * bearer tokens never reach the logs, even at debug, and the shared `err`
 * serializer keeps error payloads (e.g. Sequelize bound values) out of 5xx
 * logs.
 */
const httpLoggerOptions = {
  level: logLevel,
  // One id per request. Reuse the caller's `x-request-id` (proxies and API
  // clients commonly send one) so the same id follows the request across
  // systems; generate a UUID otherwise. The id is echoed on the response,
  // so a client can report "request abc-123 failed" and support can pull
  // the matching log lines.
  genReqId: (req, res) => {
    const id = req.headers['x-request-id'] || randomUUID();
    res.setHeader('x-request-id', id);
    return id;
  },
  redact: {
    paths: [
      'req.headers.cookie',
      'req.headers.authorization',
      'res.headers["set-cookie"]',
    ],
    censor: '[redacted]',
  },
  serializers: {
    err: errSerializer,
    ...(isVerbose
      ? {
          req: (req) => ({ ...pino.stdSerializers.req(req), url: fullUrl(req) }),
          res: pino.stdSerializers.res,
        }
      : {
          req: (req) => ({ id: req.id, method: req.method, url: fullUrl(req) }),
          res: (res) => ({ statusCode: res.statusCode }),
        }),
  },
  customLogLevel: (_req, res, err) => {
    if (err || res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  customSuccessMessage: (req, res, responseTime) =>
    requestSummary(req, res, colorizeDuration(responseTime)),
  customErrorMessage: (req, res, err) => requestSummary(req, res, err.message),
};

export const createHttpLogger = () => instantiate(pinoHttp, httpLoggerOptions);
