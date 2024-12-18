import { Garment } from '@tailor-cms/garment';

// Baked-in, supporting only localstack based PR workflow
const garment = new Garment({
  provider: 'aws',
  bucket: 'test',
  aws: {
    endpoint: 'http://localhost:4566',
    region: 'us-east-1',
    keyId: 'test',
    secretKey: 'test',
    forcePathStyle: true,
  },
});

export default garment;
