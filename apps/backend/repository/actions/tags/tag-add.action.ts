import { defineAction } from '#shared/request/action.ts';
import * as schemas from '../../repository.schema.ts';
import * as service from '../../repository.service.ts';

// POST /repositories/:repositoryId/tags
// Attaches a tag to the repository, creating the Tag row if missing.
export default defineAction({
  body: schemas.AddTagInput,
  openapi: {
    summary: 'Attach a tag to a repository',
    authenticated: true,
  },
  async handler({ body, req }) {
    return service.addTag(req.repository!, body.name);
  },
});
