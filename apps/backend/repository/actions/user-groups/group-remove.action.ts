import { defineAction } from '#shared/request/action.ts';
import * as schemas from '../../repository.schema.ts';
import * as service from '../../repository.service.ts';

// DELETE /repositories/:repositoryId/user-group/:userGroupId
// Unshares the repository from the given user group.
export default defineAction({
  params: schemas.RemoveUserGroupParams,
  openapi: {
    summary: 'Unshare a repository from a user group',
    authenticated: true,
    responses: { 204: { description: 'No content' } },
  },
  async handler({ params, req }) {
    await service.removeUserGroup(req.repository!, params.userGroupId);
  },
});
