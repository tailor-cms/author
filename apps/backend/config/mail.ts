import { env } from './env.ts';

export const user = env.EMAIL_USER;
export const password = env.EMAIL_PASSWORD;
export const host = env.EMAIL_HOST;
export const port = env.EMAIL_PORT;
export const ssl = env.EMAIL_SSL;
export const tls = env.EMAIL_TLS;
export const debug = env.EMAIL_DEBUG;

export const sender = {
  name: env.EMAIL_SENDER_NAME,
  address: env.EMAIL_SENDER_ADDRESS,
};
