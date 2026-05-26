import { oneLine } from 'common-tags';

import { defineAction } from '#shared/request/action.ts';

import * as schemas from '../schemas/index.ts';
import * as service from '../asset.service.ts';
import type { ListOptions } from '../types.ts';

// GET /repositories/:repositoryId/assets
// Two call shapes share this single route. `?key=<storageKey>` short-
// circuits to a legacy signed-URL response (the storage router was
// folded in here); everything else is the asset library listing.
export default defineAction({
  raw: true,
  query: schemas.ListFilter,
  openapi: {
    authenticated: true,
    summary: 'List assets (or resolve a storage key)',
    description: oneLine`
      Returns a paginated list of repository assets in the default mode,
      or a \`{ url }\` signed-URL response when \`?key=<storageKey>\` is set.
    `,
    responses: {
      200: {
        description: oneLine`
          Paginated list of assets, OR a key-resolve URL when
          \`?key=\` is set.
        `,
        schema: schemas.ListResponse,
      },
    },
  },
  async handler({ query, req }) {
    if (query.key) {
      const { publicUrl } = await service.getDownloadUrl(query.key);
      return { url: publicUrl };
    }
    const { key: _key, ...options } = query;
    const data = await service.list(
      req.repository!.id,
      options as ListOptions,
    );
    return { data };
  },
});
