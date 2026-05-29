import { env } from './env.ts';

export type LogLevel = typeof env.LOG_LEVEL;

export const logLevel = env.LOG_LEVEL;
