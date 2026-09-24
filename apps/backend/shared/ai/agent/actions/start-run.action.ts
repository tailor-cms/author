import * as schemas from '../schemas/index.ts';
import { defineAction, type Ctx } from '#shared/request/action.ts';
import { agentRunner } from '../AgentRunner.ts';
import { dataEnvelope } from '#shared/request/schemas.ts';
import { oneLine } from 'common-tags';
import { StatusCodes } from 'http-status-codes';

async function handler({
  body,
  user,
  req,
}: Ctx<{ body: typeof schemas.RunInput }>) {
  const { run, isQueued } = await agentRunner.start({
    ...body,
    userId: user.id,
    repository: req.repository!,
  });
  return { runId: run.id, sessionId: run.sessionId, isQueued };
}

export default defineAction({
  name: 'startAgentRun',
  body: schemas.RunInput,
  status: StatusCodes.ACCEPTED,
  openapi: {
    authenticated: true,
    summary: 'Start a run',
    description: oneLine`
      Starts a run in the background and returns its identifier;
    `,
    responses: {
      202: {
        description: 'Run identifier and the session info.',
        schema: dataEnvelope(schemas.RunStarted),
      },
    },
  },
  handler,
});
