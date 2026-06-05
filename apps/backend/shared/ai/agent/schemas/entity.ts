import { Int, RepositoryScopedParams } from '#shared/request/schemas.ts';
import { AgentMode } from '@tailor-cms/interfaces/agent.ts';
import { oneLine } from 'common-tags';
import { z } from 'zod';

// Re-export the runtime mode enum for convenience
export { AgentMode };

// Path param shape for every `/agent/sessions/:sessionId` route. Extends
// RepositoryScopedParams so the OpenAPI doc reflects the full path
// chain
export const SessionItemParams = RepositoryScopedParams.extend({
  sessionId: z.uuid().describe('Agent session id (UUID).'),
});

export type SessionItemParams = z.infer<typeof SessionItemParams>;

// Public summary of an agent session
export const AgentSessionSummary = z
  .object({
    id: z.uuid().describe('Session id.'),
    repositoryId: Int().describe('Repository the session is scoped to.'),
    mode: z.enum(AgentMode).describe(oneLine`
      Autonomy level: \`INSPECT\` is read-only (the agent observes,
      plans, and asks); \`EDIT\` permits writes and deletions.
    `),
    createdAt: z.number().int().describe('Creation timestamp (ms since epoch).'),
    updatedAt: z.number().int().describe('Last-mutation timestamp (ms).'),
  })
  .meta({ id: 'AgentSessionSummary' })
  .describe('Lightweight agent-session row (no history / transaction log).');

export type AgentSessionSummary = z.infer<typeof AgentSessionSummary>;

export const AgentSessionOverview = AgentSessionSummary.extend({
  messageCount: z.number().int().describe('Number of model turns in history.'),
  transactionCount: z
    .number()
    .int()
    .describe('Number of write operations logged across the session.'),
})
  .meta({ id: 'AgentSessionOverview' })
  .describe(
    'Summary + derived counts (turns, transactions); returned by list.',
  );

export type AgentSessionOverview = z.infer<typeof AgentSessionOverview>;

export const AgentSessionDetail = AgentSessionSummary.extend({
  history: z
    .array(z.unknown())
    .describe('OpenAI Responses-API "input" array, accumulating across turns.'),
  transactionLog: z
    .array(z.unknown())
    .describe('Write-operation log used for undo / audit.'),
})
  .meta({ id: 'AgentSessionDetail' })
  .describe('Full agent session payload (summary + history + transaction log).');

export type AgentSessionDetail = z.infer<typeof AgentSessionDetail>;
