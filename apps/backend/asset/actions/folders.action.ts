import * as schemas from '../schemas/index.ts';
import * as service from '../asset.service.ts';
import { defineAction } from '#shared/request/action.ts';
import { oneLine } from 'common-tags';

export default defineAction({
  name: 'listFolders',
  openapi: {
    authenticated: true,
    summary: 'List asset folder paths',
    description: oneLine`
      Returns the distinct, non-empty \`meta.folder\` values across the
      repository's assets (sorted). Empty folders the user created but has
      not filled yet are tracked client-side and are not returned here.
    `,
    responses: {
      200: {
        description: 'Distinct folder paths in use.',
        schema: schemas.FoldersResponse,
      },
    },
  },
  async handler({ req }) {
    return service.listFolders(req.repository!.id);
  },
});
