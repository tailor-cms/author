import {
  RepositoryScopedParams,
  dataEnvelope,
} from '#shared/request/schemas.ts';
import { defineAction } from '#shared/request/action.ts';
import { oneLine } from 'common-tags';
import * as schemas from '../schemas/index.ts';
import * as service from '../search.service.ts';

export default defineAction({
  name: 'searchMessages',
  params: RepositoryScopedParams,
  query: schemas.SearchFilter,
  openapi: {
    authenticated: true,
    summary: 'Search messages',
    description: oneLine`
      Finds something that was said, anywhere in the repository: text,
      mentions and references. Filters combine, and every hit names the
      thread it came from.
    `,
    responses: {
      200: {
        description: 'Matching messages, newest first.',
        schema: dataEnvelope(schemas.SearchResult),
      },
    },
  },
  handler({ query, req }) {
    return service.searchMessages(req.repository!.id, query);
  },
});
