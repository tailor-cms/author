import yn from 'yn';

export const sender = {
  name: process.env.EMAIL_SENDER_NAME,
  address: process.env.EMAIL_SENDER_ADDRESS,
};

export const user: string | undefined = process.env.EMAIL_USER;

export const password: string | undefined = process.env.EMAIL_PASSWORD;

export const host: string | undefined = process.env.EMAIL_HOST;

export const port: string | null = process.env.EMAIL_PORT || null;

export const ssl = yn(process.env.EMAIL_SSL);

export const tls = yn(process.env.EMAIL_TLS);
