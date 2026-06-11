import * as schemas from '../schemas/index.ts';
import { defineAction } from '#shared/request/action.ts';
import { dataEnvelope } from '#shared/request/schemas.ts';

export default defineAction({
  name: 'getSession',
  raw: true,
  params: schemas.SessionItemParams,
  openapi: {
    authenticated: true,
    summary: 'Get an agent session',
    responses: {
      200: {
        description:
          'Full session payload (summary + history + transaction log).',
        schema: dataEnvelope(schemas.AgentSessionDetail),
      },
      403: { description: 'Session belongs to a different user.' },
      404: { description: 'Session not found in this repository.' },
    },
  },
  async handler({ req }) {
    const session = req.agentSession!;
    return {
      data: {
        ...session.summarize(),
        history: session.history,
        transactionLog: session.transactionLog,
      },
    };
  },
});
