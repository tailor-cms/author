import { defineAction } from '#shared/request/action.ts';
import { dataEnvelope } from '#shared/request/schemas.ts';
import * as schemas from '../../schemas/index.ts';

// GET /repositories/:repositoryId/references/validate
export default defineAction({
  name: 'validateReferences',
  params: schemas.RepositoryItemParams,
  openapi: {
    authenticated: true,
    summary: 'Validate cross-model references in the repository',
    responses: {
      200: {
        description: 'Dangling references grouped by holder.',
        schema: dataEnvelope(schemas.ReferenceValidationResult),
      },
    },
  },
  async handler({ req }) {
    return req.repository!.validateReferences();
  },
});
