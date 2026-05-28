import { env } from './env.ts';

export const nodeEnv = env.NODE_ENV;
export const isProduction = nodeEnv === 'production';
