import {
  RepositoryScopedParams,
  dataEnvelope,
} from '#shared/request/schemas.ts';
import { defineAction } from '#shared/request/action.ts';
import { oneLine } from 'common-tags';
import * as schemas from '../schemas/index.ts';
import * as service from '../search.service.ts';

export default defineAction({
  name: 'getAssets',
  params: RepositoryScopedParams,
  query: schemas.AssetsFilter,
  openapi: {
    authenticated: true,
    summary: 'List assets shared in threads',
    description: oneLine`
      Everything shared in the repository's conversations, most recent
      first. Returns pointers and counts; resolve them through the asset
      library.
    `,
    responses: {
      200: {
        description: 'Assets shared in threads.',
        schema: dataEnvelope(schemas.AssetsResult),
      },
    },
  },
  handler({ query, req }) {
    return service.listAssets(req.repository!.id, query);
  },
});
