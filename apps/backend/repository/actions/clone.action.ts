import { createLogger } from '#logger';
import { defineAction, type Ctx } from '#shared/request/action.ts';
import { dataEnvelope } from '#shared/request/schemas.ts';
import * as schemas from '../schemas/index.ts';

const logger = createLogger('repository:clone');

// POST /repositories/:repositoryId/clone
// Deep-clones a repository.
async function handler({
  body,
  user,
  req,
}: Ctx<{
  body: typeof schemas.CloneInput;
  params: typeof schemas.RepositoryItemParams;
}>) {
  const repository = req.repository!;
  logger.debug({ repositoryId: repository.id }, 'Cloning repository');
  return repository.clone(body.name, body.description, { userId: user.id });
}

export default defineAction({
  name: 'clone',
  params: schemas.RepositoryItemParams,
  body: schemas.CloneInput,
  openapi: {
    authenticated: true,
    summary: 'Clone a repository',
    responses: {
      200: {
        description: 'Newly created clone.',
        schema: dataEnvelope(schemas.Repository),
      },
    },
  },
  handler,
});
