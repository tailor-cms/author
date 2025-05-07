import pino from 'pino';
import pinoHttp from 'pino-http';

import { isProduction } from '#config';
import { defaultLevel } from '#config/logger.js';

const prettyTransport = {
  target: 'pino-pretty',
  options: { colorize: true },
};

const transport = isProduction ? undefined : prettyTransport;
export const createLogger = (name, opts = {}) =>
  pino({
    name,
    level: opts.level || defaultLevel,
    transport,
  });

export const createHttpLogger = () =>
  pinoHttp({ transport });
