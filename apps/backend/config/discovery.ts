import { env } from './env.ts';

export const isEnabled = env.NUXT_PUBLIC_DISCOVERY_ENABLED;

export const serper = {
  apiUrl: env.SERPER_API_URL,
  apiKey: env.SERPER_API_KEY,
  timeout: env.SERPER_TIMEOUT,
  isEnabled: !!env.SERPER_API_KEY,
};

export const unsplash = {
  apiUrl: env.UNSPLASH_API_URL,
  apiKey: env.UNSPLASH_ACCESS_KEY,
  timeout: env.UNSPLASH_TIMEOUT,
  isEnabled: !!env.UNSPLASH_ACCESS_KEY,
};

export const jina = {
  apiUrl: env.JINA_READER_URL,
  timeout: env.JINA_READER_TIMEOUT,
};

export const ogs = {
  timeout: env.OGS_TIMEOUT,
};
