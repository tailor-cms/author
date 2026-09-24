import type {
  AgentMode,
  FocusedTarget,
} from '@tailor-cms/interfaces/agent.ts';
import type { ReasoningEffortLiteral } from '@tailor-cms/interfaces/ai.ts';

export type {
  RunResult,
  ToolCallRecord,
  ToolError,
} from '@tailor-cms/interfaces/agent.ts';

// Service input for `agentRunner.start`
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
