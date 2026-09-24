// Runs the embedded authoring agent. A run works alone in the
// background, looping on the OpenAI Responses API:
//   1. Take the messages the user has queued
//   2. Ask the model what to do next (system prompt, history, tools)
//   3. Execute the tools it picked and record their results
//   4. Repeat until it has answered and nothing more is queued
// Nobody waits on the loop: clients follow it through the run's events
// and collect the result when it ends (see run/AgentRun.ts).
import {
  AgentMode,
  type AgentPendingQuestion,
} from '@tailor-cms/interfaces/agent.ts';
import { AgentRun, runRegistry } from './run/index.ts';
import type { RunInput, RunResult, ToolCallRecord } from './types.ts';
import type { ReasoningEffortLiteral } from '@tailor-cms/interfaces/ai.ts';
import type { ToolDef } from './tools/types.ts';

import { isCompactModel, supportsReasoning } from '../lib/AiPrompt.ts';
import { buildOpenAITools, findTool, type ToolContext } from './tools/index.ts';
import { sessionStore, type AgentSession } from './session/index.ts';
import { ai as aiConfig } from '#config';
import { buildFocusHeader } from './context/FocusContext.ts';
import { buildSystemPrompt } from './systemPrompt.ts';
import { createAiLogger } from '../logger.ts';
import { oneLine } from 'common-tags';
import OpenAI from 'openai';

const logger = createAiLogger('agent.runner');

// Stays `null` in AI-disabled environments so the route module still loads
// cleanly; `assertReady()` surfaces the misconfiguration on actual use.
const openaiClient = aiConfig.isEnabled
  ? new OpenAI({ apiKey: aiConfig.secretKey })
  : null;

// Cap on model calls per run, against runaway tool loops.
const MAX_TURNS = 100;

// Approximate char budgets for the session history we send back to the
// model on each turn. Picked conservatively below known model context
// windows so the system prompt (~15-20KB) + tool manifest (~30KB) +
// model output + reasoning have headroom. Tune as we observe real budgets
// for the configured model. Compaction snaps to user-message boundaries
// so function_call / function_call_output pairs stay paired.
const HISTORY_CHAR_CAP_DEFAULT = 600_000;
const HISTORY_CHAR_CAP_COMPACT = 200_000;

// Message roles in the OpenAI Responses API "input" array.
const ROLE = { Developer: 'developer', User: 'user' } as const;

// Type tags for top-level items in `response.output[]` from the OpenAI
// Responses API. The SDK embeds these as string literals inside its
// union types but doesn't export them as named constants.
const OUTPUT_ITEM = {
  Message: 'message',
  FunctionCall: 'function_call',
  FunctionCallOutput: 'function_call_output',
} as const;

// Type tags for content blocks one level deeper, inside a Message item's
// `content[]`.
const CONTENT_BLOCK = {
  OutputText: 'output_text',
} as const;

// Tool that pauses the loop so the dock renders a picker without the
// model producing a plain-text copy of the options on the next turn.
const PAUSING_TOOL = 'ask_user_question';

// Stub results for skipped tool calls; they tell the model why
// a call never ran.
const SKIPPED = {
  paused: {
    skipped: true,
    reason: 'pausing_call_took_precedence',
    message: oneLine`
      Skipped: ask_user_question was in the same batch and
      this tool has side effects. Re-emit if still needed
      after the user answers.
    `,
  },
  cancelled: {
    skipped: true,
    reason: 'cancelled',
    message: 'Skipped: the user stopped the run.',
  },
};

// OpenAI Responses API output items - the SDK has discriminated types
// but the union is broad and not export-friendly
type ApiItem = Record<string, any>;
type FunctionCall = {
  type: 'function_call';
  call_id: string;
  name: string;
  arguments?: string;
};

type ParseResult = { input: any } | { error: 'invalid_json'; message: string };

// Per-run bookkeeping; anything durable lives on the session.
interface RunState {
  // Model calls made so far; the run ends at MAX_TURNS.
  turns: number;
  // The model's latest text; what the user sees when the run ends.
  replyText: string;
  // Tool calls made so far.
  toolCount: number;
  // Set when the latest turn ended on ask_user_question.
  pendingQuestion: AgentPendingQuestion | null;
  // Passed to the model when it supports reasoning.
  reasoningEffort?: ReasoningEffortLiteral;
}

// What start() hands back: the run to follow, and whether the message
// joined a run already in progress.
export interface RunStart {
  run: AgentRun;
  isQueued: boolean;
}

export class AgentRunner {
  /**
   * Start a run in the background and return right away. When the
   * session already has a run in progress, the message joins it.
   */
  async start(input: RunInput): Promise<RunStart> {
    assertReady(input);
    const session = await this.resolveSession(input);
    const message = {
      message: input.message,
      focus: input.focus,
      mode: input.mode,
    };
    const active = runRegistry.findActive(session.id);
    if (active) {
      active.enqueue(message);
      return { run: active, isQueued: true };
    }
    const run = new AgentRun(session.id, input.repository.id, input.userId);
    run.enqueue(message);
    runRegistry.add(run);
    void this.execute(run, input);
    return { run, isQueued: false };
  }

  private async execute(run: AgentRun, input: RunInput): Promise<void> {
    const state = createRunState(input.reasoningEffort);
    let session: AgentSession | undefined;
    try {
      // Loaded fresh, so it includes everything the previous run saved.
      session = await loadSession(run.sessionId);
      const ctx = buildToolContext(input, session);
      // Our tools, plus OpenAI's server-side file_search when the
      // repository has a vector store.
      const tools = buildOpenAITools(input.repository.getVectorStoreId());
      let isFinished = false;
      while (!isFinished) {
        await this.takeQueued(run, session, input.repository);
        // Done = the model answered in text or asked the user. After
        // tool calls it needs another turn to read their results.
        const isDone = await this.runTurn(tools, ctx, session, run, state);
        await sessionStore.save(session);
        // Nothing is awaited between this check and finish(), so a message
        // sent meanwhile is either picked up here or starts a new run.
        isFinished = run.isCancelled
          || state.turns >= MAX_TURNS
          || (isDone && !run.hasQueued);
      }
      // The turn cap can end the loop with queued messages
      // (also more can arrive during flushing). Keep in history
      // so the next run picks them up; a stopped run drops queue.
      while (run.hasQueued && !run.isCancelled) {
        await this.takeQueued(run, session, input.repository);
        await sessionStore.save(session);
      }
      run.finish(assembleResult(state));
    } catch (err: any) {
      if (!run.isCancelled) {
        logger.error({ err, runId: run.id }, 'agent run failed');
      }
      if (session) await saveQuietly(session);
      run.finish(assembleResult(state), run.isCancelled ? null : err.message);
    } finally {
      runRegistry.release(run);
    }
  }

  /**
   * Add queued user messages to the history.
   */
  private async takeQueued(
    run: AgentRun,
    session: AgentSession,
    repository: any,
  ): Promise<void> {
    for (const { message, focus, mode } of run.takeQueued()) {
      session.applyMode(mode);
      const header = await buildFocusHeader(focus, repository);
      if (header) session.history.push({ role: ROLE.User, content: header });
      session.history.push({ role: ROLE.User, content: message });
      run.push({ type: 'input', message });
    }
  }

  /**
   * One model call plus the tools it asks for. Returns true when the
   * model is done (made no tool calls or asked the user question)
   */
  private async runTurn(
    tools: any[],
    ctx: ToolContext,
    session: AgentSession,
    run: AgentRun,
    state: RunState,
  ): Promise<boolean> {
    state.turns++;
    state.pendingQuestion = null;
    compactSession(session);
    const output = await this.callModel(session, ctx.repository, tools, {
      signal: run.signal,
      reasoningEffort: state.reasoningEffort,
    });
    session.history.push(...output);
    const text = extractAssistantText(output);
    if (text) {
      state.replyText = text;
      run.push({ type: 'message', text });
    }
    const calls = output.filter(isFunctionCall);
    // A question means the model is unsure, so tools with side effects
    // wait for the answer. Read tools still run; they often gather
    // context for the question itself.
    const isPausing = calls.some(isPausingCall);
    // One at a time, so results land in history in the order of the calls.
    for (const call of calls) {
      const skipped = getSkippedResult(call, run, isPausing);
      if (skipped) {
        session.history.push(formatToolResult(call.call_id, skipped));
        continue;
      }
      await this.handleCall(call, ctx, session, run, state);
    }
    return !calls.length || isPausing;
  }

  // Run one tool call: record the result in history and report it
  // as tool:start / tool:end events.
  private async handleCall(
    call: FunctionCall,
    ctx: ToolContext,
    session: AgentSession,
    run: AgentRun,
    state: RunState,
  ): Promise<void> {
    const args = parseToolArgs(call);
    const callId = call.call_id;
    run.push({
      type: 'tool:start',
      callId,
      name: call.name,
      input: 'input' in args ? args.input : call.arguments,
    });
    const record = await this.dispatchTool(call, args, ctx, session);
    const { result, invalidates } = extractInvalidates(record.result);
    const finished = { ...record, result } as ToolCallRecord;
    state.toolCount++;
    if (finished.ok && finished.name === PAUSING_TOOL) {
      state.pendingQuestion = toPendingQuestion(finished.input);
    }
    session.history.push(formatToolResult(callId, result));
    run.push({ type: 'tool:end', callId, call: finished, invalidates });
  }

  /**
   * Finds or creates the appropriate session for the run.
   */
  private async resolveSession(input: RunInput): Promise<AgentSession> {
    const session = input.sessionId
      ? await sessionStore.get(input.sessionId)
      : undefined;
    return session ?? sessionStore.getOrCreate(
      input.repository.id,
      input.userId,
      input.mode ?? AgentMode.Edit,
    );
  }

  private async callModel(
    session: AgentSession,
    repository: any,
    tools: any[],
    opts: { signal: AbortSignal; reasoningEffort?: ReasoningEffortLiteral },
  ): Promise<ApiItem[]> {
    // Rebuilt each turn since a queued message may switch the mode.
    const systemPrompt = buildSystemPromptFor(session, repository);
    const params: any = {
      model: aiConfig.modelId!,
      input: [
        { role: ROLE.Developer, content: systemPrompt },
        ...session.history,
      ],
      tools,
    };
    if (opts.reasoningEffort && supportsReasoning(aiConfig.modelId)) {
      params.reasoning = { effort: opts.reasoningEffort };
    }
    if (logger.isLevelEnabled('debug')) {
      logInputSize(systemPrompt, session.history, tools);
    }
    const response = await openaiClient!.responses.create(params, {
      signal: opts.signal,
    });
    return response.output || [];
  }

  /**
   * Look up the tool, gate by mode, then execute. Each failure becomes a
   * structured ToolCallRecord the model can recover from on the next turn.
   */
  private async dispatchTool(
    call: FunctionCall,
    args: ParseResult,
    ctx: ToolContext,
    session: AgentSession,
  ): Promise<ToolCallRecord> {
    if ('error' in args) return failure(call.name, call.arguments, args);

    const tool = findTool(call.name);
    if (!tool) return unknownToolFailure(call, args.input);

    if (!session.canRun(tool)) {
      return modeBlockedFailure(call, tool, session, args.input);
    }

    return this.executeTool(tool, call.name, args.input, ctx, session);
  }

  private async executeTool(
    tool: ToolDef,
    name: string,
    input: any,
    ctx: ToolContext,
    session: AgentSession,
  ): Promise<ToolCallRecord> {
    logger.info({ tool: name, sessionId: session.id, input }, '> tool call');
    const startedAt = Date.now();
    const result = await safeExecute(tool, name, input, ctx);
    const durationMs = Date.now() - startedAt;
    const ok = !result?.error;
    logger.info(
      {
        sessionId: session.id,
        tool: name,
        ok,
        durationMs,
        error: result?.error,
      },
      ok ? '< tool ok' : '< tool err',
    );
    return { name, input, result, ok, durationMs };
  }
}

async function loadSession(id: string): Promise<AgentSession> {
  const session = await sessionStore.get(id);
  if (!session) throw new Error('Session not found');
  return session;
}

// Save session and ignore any errors; logging them instead.
function saveQuietly(session: AgentSession): Promise<void> {
  return sessionStore
    .save(session)
    .catch((err) => logger.warn({ err }, 'session save failed'));
}

// Grounds the model in this repository's schema and the mode's rules
function buildSystemPromptFor(session: AgentSession, repository: any): string {
  return buildSystemPrompt({
    repository: {
      id: repository.id,
      schemaId: repository.schema,
      name: repository.name,
      description: repository.description,
    },
    mode: session.mode,
    hasVectorStore: !!repository.getVectorStoreId(),
  });
}

function buildToolContext(input: RunInput, session: AgentSession): ToolContext {
  return {
    userId: input.userId,
    repository: input.repository,
    transactionLog: session.transactionLog,
  };
}

function createRunState(reasoningEffort?: ReasoningEffortLiteral): RunState {
  return {
    turns: 0,
    replyText: '',
    toolCount: 0,
    pendingQuestion: null,
    reasoningEffort,
  };
}

// Size log so context-window blow-ups leave a trail.
function logInputSize(systemPrompt: string, history: ApiItem[], tools: any[]) {
  const promptChars = systemPrompt.length;
  const historyChars = approxChars(history);
  const toolsChars = approxChars(tools);
  const totalChars = promptChars + historyChars + toolsChars;
  logger.debug(
    {
      promptChars,
      historyChars,
      toolsChars,
      totalChars,
      approxTokens: Math.round(totalChars / 4),
      historyItems: history.length,
      toolCount: tools.length,
    },
    'agent input size (4 chars per token estimate)',
  );
}

// Rough character-count for any JSON-serialisable payload. Used only
// for diagnostic logging of the agent's per-turn input size, so we
// accept the cost of stringify and the lossiness of "approximate".
function approxChars(value: unknown): number {
  try {
    return JSON.stringify(value).length;
  } catch {
    return 0;
  }
}

/**
 * Trim `session.history` in place when it has grown past the model's
 * safe budget. Picks the cap from the configured model class, runs the
 * pure history compaction, persists the result on the session, and logs
 * what was dropped. No-op when the session is already inside the budget.
 */
function compactSession(session: AgentSession): void {
  const cap = isCompactModel(aiConfig.modelId)
    ? HISTORY_CHAR_CAP_COMPACT
    : HISTORY_CHAR_CAP_DEFAULT;
  const beforeChars = approxChars(session.history);
  if (beforeChars <= cap) return;
  const compacted = compactHistory(session.history, cap);
  if (compacted.length === session.history.length) return;
  logger.warn(
    {
      sessionId: session.id,
      beforeItems: session.history.length,
      afterItems: compacted.length,
      beforeChars,
      afterChars: approxChars(compacted),
      cap,
    },
    'agent history compacted',
  );
  session.history = compacted;
}

/**
 * Pure history-array transform: drop earliest items so the result fits
 * within `maxChars`. Snaps to user-message boundaries so the OpenAI
 * Responses API's function_call <-> function_call_output pairing stays
 * intact (a user message marks the start of a closed turn block).
 * Returns the input unchanged when it's already within budget, or just
 * the last user-message tail when even that exceeds the cap (in which
 * case the next API call may still reject - the session needs a manual
 * reset).
 */
function compactHistory(history: ApiItem[], maxChars: number): ApiItem[] {
  const userIndices: number[] = [];
  for (let i = 0; i < history.length; i++) {
    if (history[i].role === 'user') userIndices.push(i);
  }
  if (!userIndices.length) return history;
  // Walk earliest -> latest, return the earliest user index whose tail
  // fits the cap (preserves the most recent context that's still safe).
  for (const startIdx of userIndices) {
    if (approxChars(history.slice(startIdx)) <= maxChars) {
      return history.slice(startIdx);
    }
  }
  // Even keeping only the last user turn exceeds the cap. Return it
  // anyway - the API may still reject, but the session continues with
  // the smallest viable history shape.
  return history.slice(userIndices[userIndices.length - 1]);
}

function assertReady(input: RunInput): void {
  if (!openaiClient) {
    throw new Error(
      'AI is not configured (AI_SECRET_KEY or AI_MODEL_ID missing).',
    );
  }
  if (!input.repository) throw new Error('Repository is required');
}

async function safeExecute(
  tool: ToolDef,
  name: string,
  input: any,
  ctx: ToolContext,
): Promise<any> {
  try {
    return await tool.execute(input, ctx);
  } catch (err: any) {
    logger.error({ err, tool: name }, 'tool execute threw');
    return { error: 'tool_threw', message: err.message };
  }
}

function parseToolArgs(call: FunctionCall): ParseResult {
  if (!call.arguments) return { input: {} };
  try {
    return { input: JSON.parse(call.arguments) };
  } catch (err: any) {
    return { error: 'invalid_json', message: err.message };
  }
}

function unknownToolFailure(call: FunctionCall, input: any): ToolCallRecord {
  return failure(call.name, input, {
    error: 'unknown_tool',
    message: `No tool named "${call.name}".`,
  });
}

function modeBlockedFailure(
  call: FunctionCall,
  tool: ToolDef,
  session: AgentSession,
  input: any,
): ToolCallRecord {
  logger.info(
    { tool: call.name, scope: tool.scope, mode: session.mode },
    '< tool blocked by mode',
  );
  return failure(call.name, input, {
    error: 'mode_denied',
    message: oneLine`
      Tool "${call.name}" (scope=${tool.scope}) is not allowed in
      mode "${session.mode}". Ask the user to switch mode or take
      a different action.
    `,
    scope: tool.scope,
    mode: session.mode,
  });
}

function failure(
  name: string,
  input: any,
  result: { error: string; message: string; [k: string]: any },
): ToolCallRecord {
  return { ok: false, name, input, result, durationMs: 0 };
}

function isFunctionCall(item: ApiItem): item is FunctionCall {
  return item.type === OUTPUT_ITEM.FunctionCall;
}

function isPausingCall(call: FunctionCall): boolean {
  return call.name === PAUSING_TOOL;
}

// Read-scope tools are side-effect-free. Used by the loop to keep
// running them safely even when a pausing call is in the same batch.
function isReadCall(call: FunctionCall): boolean {
  return findTool(call.name)?.scope === 'read';
}

/**
 * Pull the assistant's textual reply out of a Responses API output[].
 *
 * Two-level flatten: the model can emit multiple `message` items in
 * one turn (rare but allowed), and each message's `content` is itself
 * an array of blocks - we want only the `output_text` blocks
 * (the prose) and skip anything else (e.g. refusal blocks, future
 * block types). Each message's blocks are concatenated as one string;
 * separate messages are joined with a newline.
 *
 * Returns '' when the turn was tool-calls-only (no message items).
 */
function extractAssistantText(output: ApiItem[]): string {
  return output
    .filter((it) => it.type === OUTPUT_ITEM.Message)
    .map((m) =>
      (m.content || [])
        .filter((c: any) => c.type === CONTENT_BLOCK.OutputText)
        .map((c: any) => c.text)
        .join(''),
    )
    .join('\n');
}

function formatToolResult(callId: string, result: unknown): ApiItem {
  return {
    type: OUTPUT_ITEM.FunctionCallOutput,
    call_id: callId,
    output: typeof result === 'string' ? result : JSON.stringify(result),
  };
}

/**
 * Every call needs a result in history, or the next model request is
 * rejected.
 */
function getSkippedResult(
  call: FunctionCall,
  run: AgentRun,
  isPausing: boolean,
) {
  if (run.isCancelled) return SKIPPED.cancelled;
  if (isPausing && !isPausingCall(call) && !isReadCall(call)) {
    return SKIPPED.paused;
  }
  return null;
}

// Data client should refetch
function extractInvalidates(result: any): { result: any; invalidates: string[] } {
  if (!result || typeof result !== 'object' || !('_invalidates' in result)) {
    return { result, invalidates: [] };
  }
  const { _invalidates, ...rest } = result;
  const invalidates = Array.isArray(_invalidates) ? _invalidates : [];
  return { result: rest, invalidates };
}

function toPendingQuestion(input: any): AgentPendingQuestion {
  return {
    title: input?.title ?? '',
    question: input?.question ?? '',
    options: input?.options ?? [],
    allowOther: input?.allowOther !== false,
  };
}

function assembleResult(state: RunState): RunResult {
  return {
    replyText: state.replyText,
    turns: state.turns,
    toolCount: state.toolCount,
    truncated: state.turns >= MAX_TURNS,
    pendingQuestion: state.pendingQuestion,
  };
}

export const agentRunner = new AgentRunner();
