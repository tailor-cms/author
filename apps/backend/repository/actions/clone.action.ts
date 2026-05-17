import { z } from 'zod';
import { createLogger } from '#logger';
import { defineAction, type Ctx } from '#shared/request/action.ts';
import { Description, ShortText } from '#shared/request/schemas.ts';

const logger = createLogger('repository:clone');

// POST /repositories/:repositoryId/clone
// Deep-clones a repository.
const Body = z.object({
  // Display name for the clone (2..250 chars).
  name: ShortText(2, 250),
  // Description for the clone (2..2000 chars).
  description: Description(2, 2000),
});
export type CloneBody = z.infer<typeof Body>;

async function handler({ body, user, req }: Ctx<{ body: typeof Body }>) {
  const repository = req.repository!;
  logger.debug({ repositoryId: repository.id }, 'Cloning repository');
  return repository.clone(body.name, body.description, { userId: user.id });
}

export default defineAction({
  body: Body,
  openapi: {
    summary: 'Clone a repository',
    authenticated: true,
  },
  handler,
});
