import 'dotenv/config';
import yn from 'yn';

import { createLogger } from '#logger';

interface ParsedConnection {
  url?: string;
  database?: string;
  username?: string | undefined;
  password?: string | undefined;
  host?: string | undefined;
  port?: string | undefined;
  dialect?: string;
  dialectOptions?: Record<string, unknown>;
}

function parseConfig(config: NodeJS.ProcessEnv = process.env): ParsedConnection {
  const DATABASE_URI = config.DATABASE_URI || config.POSTGRES_URI;
  if (DATABASE_URI) return { url: DATABASE_URI };
  if (!config.DATABASE_NAME) {
    throw new TypeError(
      `Invalid \`DATABASE_NAME\` provided: ${config.DATABASE_NAME}`,
    );
  }
  const dialectOptions = yn(config.DATABASE_SSL)
    ? { ssl: { require: true, rejectUnauthorized: false } }
    : {};
  return {
    database: config.DATABASE_NAME,
    username: config.DATABASE_USER,
    password: config.DATABASE_PASSWORD,
    host: config.DATABASE_HOST,
    port: config.DATABASE_PORT,
    dialect: config.DATABASE_ADAPTER || 'postgres',
    dialectOptions,
  };
}

const logger = createLogger('db');

interface LogPayload {
  msg: string;
  duration?: string;
}

const config = {
  ...parseConfig(),
  benchmark: process.env.NODE_ENV === 'production',
  migrationStorageTableName: 'sequelize_meta',
  migrateOnStartup: !yn(process.env.DATABASE_DISABLE_MIGRATIONS_ON_STARTUP),
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
