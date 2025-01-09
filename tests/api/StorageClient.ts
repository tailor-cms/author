import { Garment } from '@tailor-cms/garment';

const { LOCALSTACK_ENDPOINT, LOCALSTACK_REGION, LOCALSTACK_BUCKET } =
  process.env;

const isConfigured =
  LOCALSTACK_ENDPOINT && LOCALSTACK_BUCKET && LOCALSTACK_REGION;

// Baked-in, supporting only localstack based PR workflow
const garment = isConfigured && new Garment({
  provider: 'aws',
  bucket: LOCALSTACK_BUCKET as string,
  aws: {
    endpoint: LOCALSTACK_ENDPOINT,
    region: LOCALSTACK_REGION,
    keyId: 'test',
    secretKey: 'test',
    forcePathStyle: true,
  },
});

export default garment;
