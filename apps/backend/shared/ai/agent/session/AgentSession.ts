import type { AgentMode } from '@tailor-cms/interfaces/agent.ts';

import { isToolAllowed, type OperationEntry, type ToolDef } from '../tools/types.ts';

// Public summary used by HTTP responses
export interface AgentSessionSummary {
  id: string;
  repositoryId: number;
  mode: AgentMode;
  createdAt: number;
  updatedAt: number;
}

// Used for both constructor input
// and the value stored by Keyv: `JSON.stringify(session)`
// `new AgentSession(raw)` rehydrates it on read.
export interface AgentSessionData {
  id: string;
  repositoryId: number;
  userId: number;
  createdAt: number;
  updatedAt: number;
  // OpenAI Responses API "input" array, accumulates across turns.
  history: any[];
  // Lightweight write-operation log for undo/audit.
  transactionLog: OperationEntry[];
  mode: AgentMode;
}

export class AgentSession implements AgentSessionData {
  id: string;
  repositoryId: number;
  userId: number;
  createdAt: number;
  updatedAt: number;
  history: any[];
  transactionLog: OperationEntry[];
  mode: AgentMode;

  constructor(data: AgentSessionData) {
    this.id = data.id;
    this.repositoryId = data.repositoryId;
    this.userId = data.userId;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    this.history = data.history;
    this.transactionLog = data.transactionLog;
    this.mode = data.mode;
  }

  summarize(): AgentSessionSummary {
    return {
      id: this.id,
      repositoryId: this.repositoryId,
      mode: this.mode,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * Per-turn mode override: the dock sends `mode` on every run reflecting
   * the user's current picker selection. Apply it so changing the
   * dropdown takes effect immediately (instead of only at session
   * creation, which would make the picker silently inert for any
   * resumed conversation).
   */
  applyMode(mode: AgentMode | undefined): void {
    if (mode && mode !== this.mode) this.mode = mode;
  }

  /**
   * Whether this session's mode permits running a given tool. Encapsulates
   * the scope vs mode mapping so callers don't need to know the rules.
   */
  canRun(tool: ToolDef): boolean {
    return isToolAllowed(tool.scope, this.mode);
  }
}
