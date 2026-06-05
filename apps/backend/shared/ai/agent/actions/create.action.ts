import * as schemas from '../schemas/index.ts';
import { AgentMode } from '@tailor-cms/interfaces/agent.ts';
import { defineAction, type Ctx } from '#shared/request/action.ts';
import { dataEnvelope } from '#shared/request/schemas.ts';
import { sessionStore } from '../session/index.ts';

async function handler({
  body,
  user,
  req,
}: Ctx<{ body: typeof schemas.CreateInput }>) {
  const repository = req.repository!;
  const { mode = AgentMode.Edit } = body;
  const session = await sessionStore.create(repository.id, user.id, mode);
  return { data: session.summarize() };
}

export default defineAction({
  raw: true,
  body: schemas.CreateInput,
  openapi: {
    authenticated: true,
    summary: 'Create an agent session',
    responses: {
      200: {
        description: 'The newly created session (summary shape).',
        schema: dataEnvelope(schemas.AgentSessionSummary),
      },
    },
  },
  handler,
});
