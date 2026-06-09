import type {
  AgentMode,
  FocusedTarget,
  RunResult as WireRunResult,
} from '@tailor-cms/interfaces/agent.ts';
import type { ReasoningEffortLiteral } from '@tailor-cms/interfaces/ai.ts';

import type { OperationEntry } from './tools/types.ts';

export type {
  ToolCallRecord,
  ToolError,
} from '@tailor-cms/interfaces/agent.ts';

// Service input for `agentRunner.run`
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
