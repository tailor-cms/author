import {
  RepositoryScopedParams,
  dataEnvelope,
} from '#shared/request/schemas.ts';
import { defineAction } from '#shared/request/action.ts';
import * as schemas from '../schemas/index.ts';
import * as service from '../thread.service.ts';

export default defineAction({
  name: 'markAllRead',
  params: RepositoryScopedParams,
  openapi: {
    authenticated: true,
    summary: 'Mark every thread in the repository read',
    responses: {
      200: {
        description: 'Refreshed unread counts.',
        schema: dataEnvelope(schemas.UnreadSummary),
      },
    },
  },
  handler({ user, req }) {
    return service.markAllRead(req.repository!.id, user.id);
  },
});
