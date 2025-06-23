const env = process.env;

export const Level = {
  Fatal: 'fatal',
  Error: 'error',
  Warn: 'warn',
  Info: 'info',
  Debug: 'debug',
  Trace: 'trace',
  Silent: 'silent',
};

export const logLevel = env.LOG_LEVEL?.toLowerCase() || Level.Info;

if (!Object.values(Level).includes(logLevel)) {
  throw new Error(`Invalid log level: ${logLevel}`);
}
