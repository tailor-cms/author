import { defineAction } from '#shared/request/action.ts';
import * as service from '../user-group.service.ts';

export default defineAction({
  openapi: {
    summary: 'Delete a user group',
    authenticated: true,
    responses: {
      204: { description: 'No content' },
      403: { description: 'Caller is not an admin or group admin' },
      404: { description: 'User group not found' },
    },
  },
  async handler({ req }) {
    await service.remove(req.userGroup!.id);
  },
});
