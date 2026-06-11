import * as schemas from '../schemas/index.ts';
import { z } from 'zod';
import { defineAction } from '#shared/request/action.ts';
import { dataEnvelope } from '#shared/request/schemas.ts';
import { sessionStore } from '../session/index.ts';

// GET /repositories/:repositoryId/agent/sessions
// Lists the current user's agent sessions in this repository.
export default defineAction({
  name: 'listSessions',
  raw: true,
  openapi: {
    authenticated: true,
    summary: 'List agent sessions',
    responses: {
      200: {
        description:
          'Sessions for the (user, repository) pair, each with derived counts.',
        schema: dataEnvelope(z.array(schemas.AgentSessionOverview)),
      },
    },
  },
  async handler({ user, req }) {
    const repository = req.repository!;
    const sessions = await sessionStore.list(repository.id, user.id);
    const data = sessions.map((it) => ({
      ...it.summarize(),
      messageCount: it.history.length,
      transactionCount: it.transactionLog.length,
    }));
    return { data };
  },
});
