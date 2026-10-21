import { defineAction } from '#shared/request/action.ts';
import { dataEnvelope } from '#shared/request/schemas.ts';

import * as schemas from '../schemas/index.ts';

export default defineAction({
  name: 'getAsset',
  params: schemas.AssetItemParams,
  openapi: {
    authenticated: true,
    summary: 'Get an asset',
    description: 'Returns a single asset from the repository library.',
    responses: {
      200: {
        description: 'Asset entity.',
        schema: dataEnvelope(schemas.Asset),
      },
      404: { description: 'Asset not found in this repository.' },
    },
  },
  async handler({ req }) {
    return req.asset!;
  },
});
