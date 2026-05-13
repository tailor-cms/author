import { z } from 'zod';
import { defineAction } from '#shared/request/action.ts';
import { IntParam } from '#shared/request/schemas.ts';
import * as service from '../../repository.service.ts';

// DELETE /repositories/:repositoryId/user-group/:userGroupId
// Unshares the repository from the given user group.
const Params = z.object({
  userGroupId: IntParam(),
});

export default defineAction({
  params: Params,
  openapi: {
    summary: 'Unshare a repository from a user group',
    authenticated: true,
    responses: { 204: { description: 'No content' } },
  },
  async handler({ params, req }) {
    await service.removeUserGroup(req.repository!, params.userGroupId);
  },
});
