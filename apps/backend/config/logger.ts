const env = process.env;

export const Level = {
  Fatal: 'fatal',
  Error: 'error',
  Warn: 'warn',
  Info: 'info',
  Debug: 'debug',
  Trace: 'trace',
  Silent: 'silent',
} as const;

export type LogLevel = (typeof Level)[keyof typeof Level];

export const logLevel: LogLevel =
  (env.LOG_LEVEL?.toLowerCase() as LogLevel) || Level.Info;

if (!Object.values(Level).includes(logLevel)) {
  throw new Error(`Invalid log level: ${logLevel}`);
}
