import { oneLine } from 'common-tags';
import { z } from 'zod';
import { defineAction } from '#shared/request/action.ts';
import { dataEnvelope } from '#shared/request/schemas.ts';
import * as schemas from '../schemas/index.ts';
import * as service from '../tag.service.ts';

// GET /tags
// Returns the tag catalog. The FE filter dropdowns use `associated=true`
// to scope the list to tags reachable through the current user's
// repositories;
export default defineAction({
  query: schemas.ListFilter,
  openapi: {
    summary: 'List tags',
    description: oneLine`
      Returns the tag catalog, optionally scoped to tags reachable
      through the current user's repositories.
    `,
    authenticated: true,
    responses: {
      200: {
        description: 'Tag catalog (optionally scoped to the user).',
        schema: dataEnvelope(z.array(schemas.Tag)),
      },
    },
  },
  async handler({ query, user }) {
    return service.list(user, query);
  },
});
