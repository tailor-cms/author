import { env } from './env.ts';
import { createLogger } from '#logger';

const logger = createLogger('db');

interface LogPayload {
  msg: string;
  duration?: string;
}

const connection = env.DATABASE_URI
  ? { url: env.DATABASE_URI }
  : {
      database: env.DATABASE_NAME,
      username: env.DATABASE_USER,
      password: env.DATABASE_PASSWORD,
      host: env.DATABASE_HOST,
      port: env.DATABASE_PORT,
      dialect: env.DATABASE_ADAPTER,
      dialectOptions: env.DATABASE_SSL
        ? { ssl: { require: true, rejectUnauthorized: false } }
        : {},
    };

const config = {
  ...connection,
  // Time each query and hand the elapsed ms to `logging` (2nd arg), powering
  // the `duration` field below.
  benchmark: true,
  // Table Sequelize uses to record which migrations have run.
  migrationStorageTableName: 'sequelize_meta',
  // Apply pending migrations on boot unless explicitly disabled via env.
  migrateOnStartup: !env.DATABASE_DISABLE_MIGRATIONS_ON_STARTUP,
  logger,
  // Called by Sequelize for every query.
  // https://sequelize.org/docs/v6/getting-started/#logging
  // With `benchmark` on, the 2nd arg is the elapsed ms
  logging(msg: string, time?: number) {
    const info: LogPayload = { msg };
    if (typeof time === 'number') info.duration = `${time}ms`;
    return logger.debug(info);
  },
};

export default config;

export const development = config;
export const test = config;
export const production = config;
