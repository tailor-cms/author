import * as schemas from '../schemas/index.ts';
import * as service from '../asset.service.ts';
import { defineAction } from '#shared/request/action.ts';
import { dataEnvelope } from '#shared/request/schemas.ts';
import { oneLine } from 'common-tags';

export default defineAction({
  name: 'deleteFolder',
  query: schemas.DeleteFolderQuery,
  openapi: {
    authenticated: true,
    summary: 'Delete a folder and its contents',
    description: oneLine`
      Soft-deletes every asset in the folder (\`?folder=<path>\`) or nested
      beneath it. Folders are virtual (derived from \`meta.folder\`), so this
      removes the folder too. Returns the ids that were removed.
    `,
    responses: {
      200: {
        description: 'Ids of the assets removed along with the folder.',
        schema: dataEnvelope(schemas.DeleteFolderResult),
      },
    },
  },
  async handler({ query, req }) {
    const deletedIds = await service.deleteFolder(req.repository!, query.folder);
    return { deletedIds };
  },
});
