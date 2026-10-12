import * as schemas from '../schemas/index.ts';
import { defineAction } from '#shared/request/action.ts';
import { runRegistry } from '../run/index.ts';
import { sessionStore } from '../session/index.ts';

export default defineAction({
  name: 'deleteSession',
  params: schemas.SessionItemParams,
  openapi: {
    authenticated: true,
    summary: 'Delete an agent session',
    responses: {
      204: { description: 'Session deleted.' },
      403: { description: 'Session belongs to a different user.' },
      404: { description: 'Session not found in this repository.' },
    },
  },
  async handler({ req }) {
    const session = req.agentSession!;
    runRegistry.findActive(session.id)?.cancel();
    await sessionStore.delete(session.id);
  },
});
