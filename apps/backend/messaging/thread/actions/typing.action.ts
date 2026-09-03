import { RepositoryScopedParams } from '#shared/request/schemas.ts';
import { defineAction } from '#shared/request/action.ts';
import * as schemas from '../schemas/index.ts';
import * as service from '../thread.service.ts';

export default defineAction({
  name: 'reportTyping',
  params: RepositoryScopedParams,
  body: schemas.TypingInput,
  openapi: {
    authenticated: true,
    summary: 'Broadcast a typing signal',
    responses: { 204: { description: 'Signal broadcast.' } },
  },
  handler({ body, user, req }) {
    service.broadcastTyping(req.repository!.id, body.threadId, user);
  },
});
