import { defineAction, type Ctx } from '#shared/request/action.ts';
import * as schemas from '../schemas/index.ts';
import { dataEnvelope } from '#shared/request/schemas.ts';
import { oneLine } from 'common-tags';

async function handler({
  query,
  req,
}: Ctx<{
  params: typeof schemas.RunItemParams;
  query: typeof schemas.RunSnapshotQuery;
}>) {
  const run = req.agentRun!;
  const { after = 0, wait = 0 } = query;
  const isIdle = run.isRunning && !run.hasEventsAfter(after);
  if (wait && isIdle) await run.waitForChange(wait * 1000);
  return run.snapshot(after);
}

export default defineAction({
  name: 'getAgentRun',
  params: schemas.RunItemParams,
  query: schemas.RunSnapshotQuery,
  openapi: {
    authenticated: true,
    summary: 'Get run progress',
    description: oneLine`
      Returns the run state and the events. With
      \`wait\`, holds the request until new events are available.
    `,
    responses: {
      200: {
        description: 'Run status, new events, and the result once ended.',
        schema: dataEnvelope(schemas.RunSnapshot),
      },
      403: { description: 'Belongs to a different user.' },
      404: { description: 'Not found.' },
    },
  },
  handler,
});
