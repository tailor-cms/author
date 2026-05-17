import { defineAction } from '#shared/request/action.ts';
import * as service from '../user-group.service.ts';

// DELETE /user-group/:id
// Hard-deletes the group and its association rows
// in a single transaction (member, repository).
export default defineAction({
  openapi: {
    summary: 'Delete a user group',
    authenticated: true,
    responses: { 204: { description: 'No content' } },
  },
  async handler({ req }) {
    await service.remove(req.userGroup!.id);
  },
});
