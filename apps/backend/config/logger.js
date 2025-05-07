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

const parsedLevel = env.LOG_LEVEL?.toLowerCase() || Level.Info;

if (!Object.values(Level).includes(parsedLevel)) {
  throw new Error(`Invalid log level: ${parsedLevel}`);
}

export const logLevel = parsedLevel;
