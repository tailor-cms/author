import {
  Int,
  RepositoryScopedParams,
  UInt,
  Uid,
} from '#shared/request/schemas.ts';
import { AgentMode } from '@tailor-cms/interfaces/agent.ts';
import { oneLine } from 'common-tags';
import { z } from 'zod';

// Re-export the runtime mode enum for convenience
export { AgentMode };

// UUID identifier for an agent session.
export const SessionId = () => Uid('Agent session UID.');

// Conversation history; the OpenAI Responses-API input array, growing
// across turns. Entries are passed through verbatim;
export const AgentHistory = z
  .array(z.unknown())
  .meta({ id: 'AgentHistory' })
  .describe('OpenAI Responses-API input array, accumulating across turns.');

// Write-operation audit log used for undo and forensic inspection of an
// agent run. Each entry is an opaque transaction record produced by a
// write-tool; consumers replay them in reverse to undo.
export const AgentTransactionLog = z
  .array(z.unknown())
  .meta({ id: 'AgentTransactionLog' })
  .describe('Write-operation audit log; entries are opaque transaction records.');

// Path param shape for every `/agent/sessions/:sessionId` route. Extends
// RepositoryScopedParams so the OpenAPI doc reflects the full path
// chain.
export const SessionItemParams = RepositoryScopedParams.extend({
  sessionId: SessionId(),
});

export type SessionItemParams = z.infer<typeof SessionItemParams>;

// Public summary of an agent session.
export const AgentSessionSummary = z
  .object({
    id: SessionId(),
    repositoryId: Int().describe('Repository the session is scoped to.'),
    mode: z.enum(AgentMode).describe(oneLine`
      Autonomy level: \`INSPECT\` is read-only (the agent observes,
      plans, and asks); \`EDIT\` permits writes and deletions.
    `),
    createdAt: UInt().describe('Creation timestamp (ms since epoch).'),
    updatedAt: UInt().describe('Last-mutation timestamp (ms).'),
  })
  .meta({ id: 'AgentSessionSummary' })
  .describe('Lightweight agent-session row (no history / transaction log).');

export type AgentSessionSummary = z.infer<typeof AgentSessionSummary>;

export const AgentSessionOverview = AgentSessionSummary.extend({
  messageCount: UInt().describe('Number of model turns in history.'),
  transactionCount: UInt().describe(
    'Number of write operations logged across the session.',
  ),
})
  .meta({ id: 'AgentSessionOverview' })
  .describe(
    'Summary + derived counts (turns, transactions); returned by list.',
  );

export type AgentSessionOverview = z.infer<typeof AgentSessionOverview>;

export const AgentSessionDetail = AgentSessionSummary.extend({
  history: AgentHistory,
  transactionLog: AgentTransactionLog,
})
  .meta({ id: 'AgentSessionDetail' })
  .describe('Full agent session payload (summary + history + transaction log).');

export type AgentSessionDetail = z.infer<typeof AgentSessionDetail>;
