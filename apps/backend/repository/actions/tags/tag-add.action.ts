import { defineAction } from '#shared/request/action.ts';
import { dataEnvelope } from '#shared/request/schemas.ts';
import { Tag } from '#app/tag/schemas/entity.ts';
import * as schemas from '../../schemas/index.ts';
import * as service from '../../repository.service.ts';

// POST /repositories/:repositoryId/tags
// Attaches a tag to the repository, creating the Tag row if missing.
export default defineAction({
  name: 'addTag',
  params: schemas.RepositoryItemParams,
  body: schemas.AddTagInput,
  openapi: {
    authenticated: true,
    summary: 'Attach a tag to a repository',
    responses: {
      200: {
        schema: dataEnvelope(Tag),
        description:
          'Tag attached to (and possibly created for) the repository.',
      },
    },
  },
  async handler({ body, req }) {
    return service.addTag(req.repository!, body.name);
  },
});
