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
  benchmark: env.NODE_ENV === 'production',
  migrationStorageTableName: 'sequelize_meta',
  migrateOnStartup: !env.DATABASE_DISABLE_MIGRATIONS_ON_STARTUP,
  logger,
  // https://sequelize.org/docs/v6/getting-started/#logging
  logging(msg: string, time?: number) {
    const info: LogPayload = { msg };
    if (time) info.duration = `${time}ms`;
    return logger.info(info);
  },
};

export default config;

export const development = config;
export const test = config;
export const production = config;
