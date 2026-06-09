import { defineAction, type Ctx } from '#shared/request/action.ts';
import * as schemas from '../schemas/index.ts';
import { agentRunner } from '../AgentRunner.ts';
import { dataEnvelope } from '#shared/request/schemas.ts';
import { oneLine } from 'common-tags';

async function handler({
  body,
  user,
  req,
}: Ctx<{ body: typeof schemas.RunInput }>) {
  const repository = req.repository!;
  const { sessionId, message, mode, focus, reasoningEffort } = body;
  return agentRunner.run({
    sessionId,
    userId: user.id,
    repository,
    message,
    mode,
    focus,
    reasoningEffort,
  });
}

export default defineAction({
  name: 'runAgent',
  body: schemas.RunInput,
  openapi: {
    authenticated: true,
    summary: 'Run an agent turn',
    description: oneLine`
      Resumes or creates a session and dispatches one model + tool
      round-trip; returns the reply, tool log, and Frontend invalidation hints.
    `,
    responses: {
      200: {
        description: oneLine`
          Reply text, tool-call audit log, frontend invalidation hints,
          and an optional clickable picker the model attached to the turn.
        `,
        schema: dataEnvelope(schemas.RunResult),
      },
    },
  },
  handler,
});
