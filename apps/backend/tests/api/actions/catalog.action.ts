import { oneLine } from 'common-tags';
import { defineAction } from '#shared/request/action.ts';
import * as schemas from '../seed.schema.ts';
import service from '../seed.service.ts';

// POST /seed/catalog
// Seeds the repository catalog from `tailor-seed/repositories.json`
// under the default seed user; optionally shares them with a user group.
export default defineAction({
  body: schemas.CatalogInput,
  openapi: {
    summary: 'Seed the repository catalog',
    description: oneLine`
      Seeds the repository catalog from the tailor-seed fixtures under
      the default seed user; optionally shares them with a user group.
    `,
    authenticated: true,
  },
  async handler({ body }) {
    return service.seedCatalog(body);
  },
});
