// Common tool plumbing - DB context, logger, error
// responses, and operation recording. Shared across all tools.
import { createAiLogger } from '../../../logger.ts';
import type { OperationEntry, ToolContext } from '../types.ts';

export const logger = createAiLogger('agent.tools');

interface ToolErrorOptions {
  tool: string;
  reason: string;
  message: string;
  [key: string]: any;
}

// Build a tool error response. The error code is
// constructed as `${tool}_${reason}` so format
// changes only need to happen here.
export function toolError(opts: ToolErrorOptions) {
  const { tool, reason, message, ...extra } = opts;
  return {
    error: `${tool}_${reason}`,
    message,
    ...extra,
  };
}

const MAX_LOG_ENTRIES = 100;

// Record an operation in the transaction log for undo and audit
// purposes. Only what undo needs is kept;
export function recordOperation(
  tool: string,
  ctx: ToolContext,
  inverse?: OperationEntry['inverse'],
) {
  const log = ctx.transactionLog;
  log.push({
    seq: (log.at(-1)?.seq ?? 0) + 1,
    tool,
    inverse,
    timestamp: Date.now(),
  });
  if (log.length > MAX_LOG_ENTRIES) log.splice(0, log.length - MAX_LOG_ENTRIES);
}

// Build the Sequelize operation context required by
// Activity/ContentElement hooks (SSE, revisions, etc.).
// Every create/update/destroy call needs this.
export function dbContext(ctx: ToolContext) {
  return { userId: ctx.userId, repository: ctx.repository };
}
