import { env } from './env.ts';

export const provider = env.STORAGE_PROVIDER;

// Path where assets are stored inside repository/${repositoryId} folder.
// e.g. path='assets' -> repository/${repositoryId}/assets/...
export const path = 'assets';

// Internal uri scheme used to reference internally stored assets.
export const protocol = 'storage://';

export const amazon = {
  key: env.STORAGE_KEY,
  secret: env.STORAGE_SECRET,
  region: env.STORAGE_REGION,
  bucket: env.STORAGE_BUCKET,
  endpoint: env.STORAGE_ENDPOINT,
};

export const filesystem = {
  path: env.STORAGE_PATH,
};
