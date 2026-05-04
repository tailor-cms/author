import type { Response } from 'express';
import { AgentMode } from '@tailor-cms/interfaces/agent.ts';
import { StatusCodes } from 'http-status-codes';

import { agentRunner } from './AgentRunner.ts';
import { sessionStore } from './session/index.ts';
import type { AgentItemRequest, AgentRequest } from './types.ts';

async function index({ user, repository }: AgentRequest, res: Response) {
  const sessions = await sessionStore.list(repository.id, user.id);
  const data = sessions.map((it) => ({
    ...it.summarize(),
    messageCount: it.history.length,
    transactionCount: it.transactionLog.length,
  }));
  return res.json({ data });
}

function show({ agentSession }: AgentItemRequest, res: Response) {
  return res.json({
    data: {
      ...agentSession.summarize(),
      history: agentSession.history,
      transactionLog: agentSession.transactionLog,
    },
  });
}

async function create(
  { user, repository, body }: AgentRequest,
  res: Response,
) {
  const { mode = AgentMode.Edit } = body;
  const session = await sessionStore.create(repository.id, user.id, mode);
  return res.json({ data: session.summarize() });
}

async function remove({ agentSession }: AgentItemRequest, res: Response) {
  await sessionStore.delete(agentSession.id);
  return res.sendStatus(StatusCodes.NO_CONTENT);
}

async function run(
  { user, repository, body }: AgentRequest,
  res: Response,
) {
  const { sessionId, message, mode, focus } = body;
  const data = await agentRunner.run({
    sessionId,
    userId: user.id,
    repository,
    mode,
    focus,
    message,
  });
  return res.json({ data });
}

export default { index, show, create, remove, run };
