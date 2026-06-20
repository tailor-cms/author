import * as schemas from '../schemas/index.ts';
import * as service from '../asset.service.ts';
import { defineAction } from '#shared/request/action.ts';
import { dataEnvelope } from '#shared/request/schemas.ts';

export default defineAction({
  name: 'getUsages',
  params: schemas.AssetItemParams,
  openapi: {
    authenticated: true,
    summary: 'List with asset usages',
    description:
      'Scans content elements, activities and repository meta for references.',
    responses: {
      200: {
        description: 'Places the asset is referenced.',
        schema: dataEnvelope(schemas.AssetUsages),
      },
      404: { description: 'Asset not found in this repository.' },
    },
  },
  async handler({ req }) {
    return service.findUsages(req.repository!, req.asset!);
  },
});
