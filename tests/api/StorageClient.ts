import { Garment } from '@tailor-cms/garment';

const { LOCALSTACK_ENDPOINT, LOCALSTACK_REGION, LOCALSTACK_BUCKET } =
  process.env;

export const isStorageConfigured =
  LOCALSTACK_ENDPOINT && LOCALSTACK_BUCKET && LOCALSTACK_REGION;

// Supporting only localstack based PR workflow
export const StorageClient = new Garment({
  provider: 'aws',
  bucket: LOCALSTACK_BUCKET as string,
  aws: {
    endpoint: LOCALSTACK_ENDPOINT,
    region: LOCALSTACK_REGION as string,
    keyId: 'test',
    secretKey: 'test',
    forcePathStyle: true,
  },
});
