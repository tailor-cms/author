import { createLogger } from '#logger';
import { defineAction, type Ctx } from '#shared/request/action.ts';
import * as schemas from '../repository.schema.ts';

const logger = createLogger('repository:clone');

// POST /repositories/:repositoryId/clone
// Deep-clones a repository.
async function handler({
  body,
  user,
  req,
}: Ctx<{ body: typeof schemas.CloneBody }>) {
  const repository = req.repository!;
  logger.debug({ repositoryId: repository.id }, 'Cloning repository');
  return repository.clone(body.name, body.description, { userId: user.id });
}

export default defineAction({
  body: schemas.CloneBody,
  openapi: {
    summary: 'Clone a repository',
    authenticated: true,
  },
  handler,
});
