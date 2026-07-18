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
 * structured req/res/responseTime fields so requests collapse to one summary
 * line; production always emits them as JSON for aggregation.
 */
const prettyStream = () =>
  pretty({
    colorize: true,
    sync: true,
    ignore: isVerbose ? 'hostname' : 'hostname,req,res,responseTime',
  });

// Attach the dev pretty stream outside production; production logs raw JSON.
const instantiate = (factory, options) =>
  isProduction ? factory(options) : factory(options, prettyStream());

export const createLogger = (name) =>
  instantiate(pino, { name, level: logLevel });

// The logger is mounted on `/api`, so Express strips that prefix from
// `req.url`; `originalUrl` keeps the full request path in the logs.
const fullUrl = (req) => req.originalUrl ?? req.url;

const requestSummary = (req, res, detail) =>
  `${req.method} ${fullUrl(req)} ${res.statusCode} (${detail})`;

/**
 * HTTP request logging, shared by prod (JSON) and dev (pretty). Each request
 * logs one concise summary line; "GET /api/users 200 (4ms)" - the dev-server
 * convention (morgan `dev`, Rails, Fastify), so a normal `info` session shows
 * request activity without a header dump; debug/trace adds the full req/res
 * detail. Level follows the outcome: 5xx / thrown errors -> error, 4xx ->
 * warn, otherwise info. `redact` is a defence-in-depth net so auth cookies /
 * bearer tokens never reach the logs, even at debug.
 */
const httpLoggerOptions = {
  level: logLevel,
  redact: {
    paths: [
      'req.headers.cookie',
      'req.headers.authorization',
      'res.headers["set-cookie"]',
    ],
    censor: '[redacted]',
  },
  serializers: isVerbose
    ? {
        req: (req) => ({ ...pino.stdSerializers.req(req), url: fullUrl(req) }),
        res: pino.stdSerializers.res,
      }
    : {
        req: (req) => ({ id: req.id, method: req.method, url: fullUrl(req) }),
        res: (res) => ({ statusCode: res.statusCode }),
      },
  customLogLevel: (_req, res, err) => {
    if (err || res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  customSuccessMessage: (req, res, responseTime) =>
    requestSummary(req, res, `${responseTime}ms`),
  customErrorMessage: (req, res, err) => requestSummary(req, res, err.message),
};

export const createHttpLogger = () => instantiate(pinoHttp, httpLoggerOptions);
