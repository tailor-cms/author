import type {
  AgentMode,
  FocusedTarget,
  RunResult as WireRunResult,
} from '@tailor-cms/interfaces/agent.ts';
import type { ReasoningEffortLiteral } from '@tailor-cms/interfaces/ai.ts';
import type { RequestHandler, Response } from 'express';

import type { AgentSession } from './session/index.ts';
import type { OperationEntry } from './tools/types.ts';

export type {
  ToolCallRecord,
  ToolError,
} from '@tailor-cms/interfaces/agent.ts';

// Properties available on the Express Request after middleware injection.
// Intentionally not extending Express.Request to avoid built-in property
// conflicts.
export interface AgentRequest {
  user: { id: number };
  // Loaded by the parent /:repositoryId middleware in apps/backend/repository;
  // ACL is enforced upstream by AccessService.hasRepositoryAccess.
  repository: any;
  agentSession?: AgentSession;
  body: any;
  query: any;
}

// Narrowed request for /sessions/:sessionId routes where loadSession
// middleware guarantees agentSession is present.
export type AgentItemRequest = AgentRequest & { agentSession: AgentSession };

// Generic over the narrowed request type so handlers expecting
// AgentItemRequest can be passed in alongside ones that take the looser
// AgentRequest.
export type AsyncHandler<R extends AgentRequest = AgentRequest> = (
  req: R,
  res: Response,
) => Promise<unknown> | unknown;

export const handler = <R extends AgentRequest>(
  fn: AsyncHandler<R>,
): RequestHandler => fn as unknown as RequestHandler;

export interface RunInput {
  sessionId?: string;
  userId: number;
  repository: any;
  message: string;
  mode?: AgentMode;
  // Implicit context from the editor - what the user is currently looking at.
  focus?: FocusedTarget[];
  // Optional reasoning effort - applied only when the configured model
  // accepts the `reasoning.effort` parameter (gpt-5 / o-series).
  reasoningEffort?: ReasoningEffortLiteral;
}

// Narrows the shared (wire) RunResult.transactionLog from opaque
// unknown[] to OperationEntry[] for backend-internal use; everything
// else carries over unchanged.
export interface RunResult extends Omit<WireRunResult, 'transactionLog'> {
  transactionLog: OperationEntry[];
}
