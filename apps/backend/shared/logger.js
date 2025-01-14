import pino from 'pino';
import pinoHttp from 'pino-http';

import { isProduction } from '#config';

export const Level = {
  Fatal: 'fatal',
  Error: 'error',
  Warn: 'warn',
  Info: 'info',
  Debug: 'debug',
  Trace: 'trace',
  Silent: 'silent',
};

const prettyTransport = {
  target: 'pino-pretty',
  options: { colorize: true },
};

const transport = isProduction ? undefined : prettyTransport;

export const createLogger = (name, opts = {}) =>
  pino({
    name,
    level: opts?.level || Level.Info,
    transport,
  });

export const createHttpLogger = () =>
  pinoHttp({ transport });
