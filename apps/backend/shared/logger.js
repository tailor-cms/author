import pino from 'pino';
import pinoHttp from 'pino-http';

import { isProduction } from '#config/runtime.ts';
import { logLevel } from '#config/logger.ts';

const prettyTransport = {
  target: 'pino-pretty',
  options: { colorize: true },
};

const transport = isProduction ? undefined : prettyTransport;
export const createLogger = (name) =>
  pino({
    name,
    level: logLevel,
    transport,
  });

export const createHttpLogger = () =>
  pinoHttp({ transport, level: logLevel });
