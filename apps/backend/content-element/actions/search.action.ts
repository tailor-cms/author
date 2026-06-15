import { defineAction } from '#shared/request/action.ts';
import { oneLine } from 'common-tags';
import { RepositoryScopedParams } from '#shared/request/schemas.ts';
import * as schemas from '../schemas/index.ts';
import * as service from '../content-element.service.ts';

// Paginated listing of the repository's content elements; with a `search`
// term it narrows to full-text matches ranked by relevance
export default defineAction({
  name: 'search',
  params: RepositoryScopedParams,
  query: schemas.SearchFilter,
  raw: true,
  openapi: {
    authenticated: true,
    summary: 'Search content elements in the repository',
    description: oneLine`
      Full-text search over element data with pagination; without a search
      term it acts as a paginated browse listing ordered by last update.
    `,
    responses: {
      200: {
        description: 'Paginated content elements matching the query.',
        schema: schemas.SearchResult,
      },
    },
  },
  async handler({ query, req }) {
    return service.search(req.repository!, req.opts!, query);
  },
});
