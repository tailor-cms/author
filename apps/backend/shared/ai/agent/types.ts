import type {
  AgentMode,
  AgentPendingQuestion,
  FocusedTarget,
} from '@tailor-cms/interfaces/agent.ts';
import type { RequestHandler, Response } from 'express';

import type { AgentSession } from './session/index.ts';
import type { OperationEntry } from './tools/types.ts';

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
  reasoningEffort?: 'minimal' | 'low' | 'medium' | 'high';
}

// Structured error envelope every failed tool call produces. Mode-denied,
// invalid-json, unknown-tool, tool-threw, and any tool using the
// tools/helpers/common.ts:toolError helper all share this shape, so
// { error, message } is reliable across the failure path.
export interface ToolError {
  error: string;
  message: string;
  // Tool-specific extras: scope/mode for mode_denied, allowedElementTypes
  // for invalid_type, etc. Not enumerated here because each tool decides.
  [extra: string]: unknown;
}

// One entry in RunResult.toolCalls. Discriminated on `ok` so consumers
// narrow `result` without manual casts:
//   if (tc.ok) tc.result.someSuccessField   // tool-specific success shape
//   else       tc.result.error              // ToolError
// `input` is intentionally `unknown`: usually parsed JSON args, but on
// invalid_json it's the raw arguments string the model emitted.
export type ToolCallRecord =
  | { name: string; input: unknown; result: unknown; ok: true; durationMs: number }
  | { name: string; input: unknown; result: ToolError; ok: false; durationMs: number };

export interface RunResult {
  sessionId: string;
  // Assistant's reply text after the loop ended (the model's last
  // text-only message). Empty string when the run produced no text.
  replyText: string;
  toolCalls: ToolCallRecord[];
  // Number of (model call -> tool dispatch) iterations the loop ran.
  turns: number;
  // True when the run was cut off (today only by maxTurns; pair with a
  // reason field if other truncation causes get added).
  truncated: boolean;
  // Cache keys the frontend should refetch after this run.
  invalidates: string[];
  // Cumulative operations across the whole session - includes prior runs
  // in the same conversation, not just this one.
  transactionLog: OperationEntry[];
  // The most recent ask_user_question call (if any) - the dock renders
  // it as a clickable picker above the input.
  pendingQuestion?: AgentPendingQuestion | null;
}
