import {
  RepositoryScopedParams,
  dataEnvelope,
} from '#shared/request/schemas.ts';
import { defineAction } from '#shared/request/action.ts';
import * as schemas from '../schemas/index.ts';
import * as service from '../thread.service.ts';

export default defineAction({
  name: 'getUnread',
  params: RepositoryScopedParams,
  openapi: {
    authenticated: true,
    summary: 'Unread badge counts',
    responses: {
      200: {
        description: 'Unread threads and mentions for the caller.',
        schema: dataEnvelope(schemas.UnreadSummary),
      },
    },
  },
  handler({ user, req }) {
    return service.unreadSummary(req.repository!.id, user.id);
  },
});
