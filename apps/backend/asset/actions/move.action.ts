import * as schemas from '../schemas/index.ts';
import * as service from '../asset.service.ts';
import { defineAction } from '#shared/request/action.ts';
import { dataEnvelope } from '#shared/request/schemas.ts';
import { oneLine } from 'common-tags';

export default defineAction({
  name: 'move',
  body: schemas.MoveInput,
  openapi: {
    authenticated: true,
    summary: 'Bulk move assets to a folder',
    description: oneLine`
      Reassigns each asset's virtual folder. Purely a metadata update; the
      underlying storage object is untouched. Returns the ids that were moved.
    `,
    responses: {
      200: {
        description: 'Subset of requested ids that were moved.',
        schema: dataEnvelope(schemas.MoveResult),
      },
    },
  },
  async handler({ body, req }) {
    const movedIds = await service.moveAssets(
      req.repository!.id,
      body.assetIds,
      body.folder,
    );
    return { movedIds };
  },
});
