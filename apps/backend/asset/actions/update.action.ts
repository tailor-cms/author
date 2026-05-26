import { oneLine } from 'common-tags';

import { defineAction } from '#shared/request/action.ts';
import { dataEnvelope } from '#shared/request/schemas.ts';

import * as schemas from '../schemas/index.ts';
import * as service from '../asset.service.ts';

// PATCH /repositories/:repositoryId/assets/:assetId
// Generic meta update. `meta.files` are excluded from the schema (Zod
// `.strip()` default drops it silently); file attachments go through
// /:assetId/file instead.
export default defineAction({
  params: schemas.AssetItemParams,
  body: schemas.UpdateInput,
  openapi: {
    authenticated: true,
    summary: 'Update asset metadata',
    description: oneLine`
      Patches editable meta fields.
      Unknown keys (including \`files\`) are silently dropped.
    `,
    responses: {
      200: {
        description: 'Updated asset row.',
        schema: dataEnvelope(schemas.Asset),
      },
      404: { description: 'Asset not found in this repository.' },
    },
  },
  async handler({ body, req }) {
    return service.updateMeta(req.asset!, body.meta);
  },
});
