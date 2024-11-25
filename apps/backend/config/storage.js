export const provider = process.env.STORAGE_PROVIDER;

// The path where assets will be stored inside repository/${repositoryId} folder.
// For example, if path is equal to assets,
// assets will be stored inside repository/${repositoryId}/assets folder
export const path = 'assets';

export const protocol = 'storage://';

export const amazon = {
  key: process.env.STORAGE_KEY,
  secret: process.env.STORAGE_SECRET,
  region: process.env.STORAGE_REGION,
  bucket: process.env.STORAGE_BUCKET,
};

export const filesystem = {
  path: process.env.STORAGE_PATH,
};
