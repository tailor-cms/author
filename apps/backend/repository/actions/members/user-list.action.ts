import { defineAction } from '#shared/request/action.ts';
import * as service from '../../repository.service.ts';

// GET /repositories/:repositoryId/users
// Returns active-access users of the repository, decorated with their
// repository role joined through RepositoryUser.
export default defineAction({
  openapi: {
    summary: 'List users with access to the repository',
    authenticated: true,
  },
  async handler({ req }) {
    return service.listUsers(req.repository!);
  },
});
