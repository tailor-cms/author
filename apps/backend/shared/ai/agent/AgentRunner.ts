// Embedded authoring agent; non-streaming agent loop for v1. Wraps the
// existing OpenAI Responses API. The loop:
//   1. Build input array (system prompt + history)
//   2. responses.create({ model, input, tools })
//   3. For each function_call output item, dispatch the matching tool and
//      append a function_call_output item to history
//   4. Loop until no more tool calls or maxTurns hit
import { AgentMode } from '@tailor-cms/interfaces/agent.ts';
import { oneLine } from 'common-tags';
import OpenAI from 'openai';
import { ai as aiConfig } from '#config';

import { buildFocusHeader } from './context/FocusContext.ts';
import { buildSystemPrompt } from './systemPrompt.ts';
import { sessionStore, type AgentSession } from './session/index.ts';
import { buildOpenAITools, findTool, type ToolContext } from './tools/index.ts';
import type { ToolDef } from './tools/types.ts';
import { createAiLogger } from '../logger.ts';
import type { RunInput, RunResult, ToolCallRecord } from './types.ts';

const logger = createAiLogger('agent.runner');

// Stays `null` in AI-disabled environments so the route module still loads
// cleanly; `assertReady()` surfaces the misconfiguration on actual use.
const openaiClient = aiConfig.isEnabled
  ? new OpenAI({ apiKey: aiConfig.secretKey })
  : null;

// Hard cap on (model call -> tool dispatch) iterations per run. Prevents
// runaway tool-call loops from chewing through API credits or hanging
// the request indefinitely.
const MAX_TURNS = 80;

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
// Detected both during loop iteration (to break early) and at run end
// (to attach `pendingQuestion` to the result).
const PAUSING_TOOL = 'ask_user_question';

// OpenAI Responses API output items - the SDK has discriminated types
// but the union is broad and not export-friendly
type ApiItem = Record<string, any>;
type FunctionCall = {
  type: 'function_call';
  call_id: string;
  name: string;
  arguments?: string;
};

/**
 * Mutable accumulator for a single `run()` call. Lives only for the
 * duration of the loop; the durable record is `session.history`.
 * Fields are mutated in place by `runTurn` / `handleCall`.
 */
interface RunState {
  // Number of (model call -> tool dispatch) iterations completed.
  // Used to enforce MAX_TURNS and reported as `turns` in the result.
  turns: number;
  // Latest assistant text reply, overwritten each turn that produces
  // a message item. The final value is what the user sees in the dock.
  replyText: string;
  // Audit log of every tool call made in this run (success + failure).
  // Source for `toolCalls` and `pendingQuestion` in the result.
  toolCalls: ToolCallRecord[];
  // Cache keys (assets, outline, etc.) the frontend should refetch
  // after the run. Tools attach `_invalidates: string[]` to their
  // result; `extractInvalidationKeys` strips and accumulates them here.
  invalidates: Set<string>;
}

export class AgentRunner {
  async run(input: RunInput): Promise<RunResult> {
    // Fail fast if AI isn't configured or repo is missing
    assertReady(input);

    // Explicit sessionId wins; otherwise reuse or lazily create the
    // user's active session for this repo. Per-turn mode override is
    // applied so the dock's picker takes effect immediately on
    // existing sessions.
    const session = await this.resolveSession(input);

    // Push two history items: an editor-state preamble (what the user
    // is currently focused on, so the model can resolve "this", "the
    // topic", etc.) followed by the user's literal message.
    //
    // Focus is bound to its turn in the durable transcript, NOT
    // injected as runtime-only context: deictic references in older
    // messages can only be reconstructed if each turn's focus snapshot
    // is preserved alongside it ("fix it" three turns ago meant the
    // element that was focused at THAT turn, not the currently-focused
    // one). Token cost is small - ~5-10 lines per turn vs a 128K
    // context window - and matches what mainstream chat-agent
    // frameworks (LangChain, ChatGPT) do for per-turn user metadata.
    await appendFocusContext(session, input);
    appendUserMessage(session, input);

    // The "developer"-role preamble sent on every model call. Composed
    // from the live repository schema (outline levels, container types,
    // allowed element types) plus the session's mode rules. Re-used as
    // the first input item every turn so the model is grounded in this
    // repo's vocabulary. See systemPrompt.ts for the exact composition.
    const systemPrompt = buildSystemPromptFor(session, input.repository);

    // Repo-scoped context handed to every tool's execute(). Acts as the
    // ACL boundary - tools never read repositoryId off `input`, they
    // pull it from ctx.repository so they cannot escape the scope.
    // Also exposes `transactionLog` (the session's mutable op log) so
    // tools can record write operations for undo/audit.
    // Example: { userId: 7, repository: <Repository#42>, transactionLog: [] }
    const ctx = buildToolContext(input, session);

    // Tool manifest sent on every responses.create() call. This is how
    // OpenAI's function-calling works in two halves:
    //
    //  1. We declare each tool as a JSON Schema (name + description +
    //     parameter shape). The model sees the manifest and, on each
    //     turn, decides whether to reply with plain text OR emit one or
    //     more `function_call` items - each carrying the tool name it
    //     picked plus a JSON-encoded `arguments` string conforming to
    //     that tool's parameter schema.
    //
    //  2. The runner parses the args, looks the tool up in the registry
    //     (findTool by name), gates by mode (isToolAllowed), executes
    //     server-side, then appends a `function_call_output` item to
    //     history so the model can read the result on its next turn.
    //
    // Built-in tools like `file_search` are different: OpenAI runs them
    // server-side against the vector store IDs we declare - there's no
    // local executor for those. They live in the same manifest because
    // the model picks them the same way.
    //
    // Example:
    //   [{ type: 'function', name: 'create_outline', parameters: {...} },
    //    { type: 'function', name: 'add_elements_to_activity', ... },
    //    { type: 'file_search', vector_store_ids: ['vs_abc...'] }]
    const tools = buildOpenAITools(input.repository.getVectorStoreId());

    // Mutable accumulator for THIS run only. Lives just for the loop;
    // anything durable goes onto `session` instead. Tracks turn count
    // (for MAX_TURNS), the latest assistant reply text, the per-tool
    // audit log, and invalidation keys for the FE to refetch.
    // Example after a 3-turn outline build:
    //   { turns: 3, replyText: 'Created module + 2 topics.',
    //     toolCalls: [...], .... }
    const state = createRunState();

    // Each iteration calls the model with the running history,
    // executes any tool calls returned, and appends function_call_output
    // items back into history. Stops when the model emits no more tool
    // calls, or a pausing tool (ask_user_question) fires.
    while (state.turns < MAX_TURNS) {
      const done = await this.runTurn(systemPrompt, tools, ctx, session, state);
      if (done) break;
    }

    // Persist the session (history, transactionLog, mode) and return
    // RunResult: replyText, toolCalls audit, invalidation keys,
    // pending question, etc.
    await sessionStore.save(session);
    return assembleResult(session, state);
  }

  /**
   * One iteration of the agent loop. Mutates state and session.history.
   * Returns true when the loop should stop (no more tool calls, model
   * error, or a paused-for-user question).
   */
  private async runTurn(
    systemPrompt: string,
    tools: any[],
    ctx: ToolContext,
    session: AgentSession,
    state: RunState,
  ): Promise<boolean> {
    state.turns++;
    logger.debug(
      { turn: state.turns, sessionId: session.id },
      'agent loop iteration',
    );

    const response = await this.callModel(systemPrompt, session.history, tools);
    if (response.error) {
      state.replyText = `Agent error: ${response.error}`;
      return true;
    }

    // Whatever the model emitted (assistant messages + function_call
    // requests) becomes part of the durable transcript.
    //
    // A typical `response.output` for a tool-calling turn looks like:
    //   [
    //     {
    //       type: 'message',
    //       role: 'assistant',
    //       content: [{
    //         type: 'output_text',
    //         text: "I'll draft that outline now."
    //       }]
    //     },
    //     {
    //       type: 'function_call',
    //       call_id: 'call_abc',
    //       name: 'create_outline',
    //       arguments: '{"activities":[{"type":"MODULE",...}]}'
    //     }
    //   ]
    // A finishing turn typically emits a single `message` item with no
    // function_calls; a tool-only turn (model just dispatching, no
    // narration) emits just function_call items.
    session.history.push(...response.output);

    // Capture any assistant text the model produced this turn. The
    // `|| state.replyText` keeps the prior reply when this turn was
    // tool-calls-only (empty text) - otherwise an earlier
    // turn would be wiped out by a silent intermediate one.
    state.replyText = extractAssistantText(response.output) || state.replyText;

    // No tool calls means the model is done thinking - it emitted only
    // text (or nothing) and is signaling end of turn. Returning `true`
    // tells run()'s while-loop to break.
    const calls = response.output.filter(isFunctionCall);
    if (!calls.length) return true;

    // When ask_user_question is in the batch, treat the question as
    // an uncertainty signal and gate the other calls by scope:
    //   - read tools execute (no side effects; the model may have
    //     dispatched them deliberately to gather context for the
    //     question, e.g. get_outline before "which topic?")
    //   - write/destructive/generate tools are skipped - they would
    //     act on the very uncertainty the model just flagged, and the
    //     model can re-emit them after the user answers
    // For each skipped call we push a synthetic function_call_output
    // event into session.history (see the loop below) - same shape as
    // a real result, but the `output` field is a stub explaining why
    // we didn't run the tool. This keeps the OpenAI Responses API's
    // function_call <-> function_call_output pairing invariant
    // satisfied; without that paired event the next responses.create()
    // request returns HTTP 400 ("No tool call found for function call
    // output") on the dangling call. Pattern aligned with OpenAI
    // Agents SDK / Microsoft Agent Framework's "per-tool approval
    // rule evaluation".
    const pausing = calls.some(isPausingCall);

    // Sequential dispatch, not Promise.all: each handleCall appends a
    // function_call_output to session.history, a later tool may inspect
    // earlier results via the shared transactionLog on ctx, and the
    // call_id ordering the model expects on the next turn would get
    // mangled by parallelism.
    for (const call of calls) {
      if (pausing && !isPausingCall(call) && !isReadCall(call)) {
        session.history.push(formatToolResult(call.call_id, {
          skipped: true,
          reason: 'pausing_call_took_precedence',
          message: oneLine`
            Skipped: ask_user_question was in the same batch and
            this tool has side effects. Re-emit if still needed
            after the user answers.
          `,
        }));
        continue;
      }
      await this.handleCall(call, ctx, session, state);
    }

    // Stop the loop if the model is now waiting on the human to pick.
    // Continuing would let the model speculate about the choice or
    // repeat the picker as plain text on the next turn.
    return pausing;
  }

  /**
   * Dispatch a single tool call, record the outcome, and append the
   * function_call_output back to history for the next turn.
   */
  private async handleCall(
    call: FunctionCall,
    ctx: ToolContext,
    session: AgentSession,
    state: RunState,
  ): Promise<void> {
    const record = await this.dispatchTool(call, ctx, session);
    state.toolCalls.push(record);

    // Tools attach `_invalidates: string[]` to their result for the
    // frontend (cache keys to refetch). It's a server-only contract -
    // we strip the field before forwarding to the model so the model
    // doesn't accidentally treat it as part of the answer, and we
    // accumulate the keys into state.invalidates so RunResult can
    // ship them to the dock.
    //
    // Before:
    //   record.result = {
    //     "ok": true,
    //     "activity": { "id": 42, "type": "MODULE", "name": "Intro" },
    //     "_invalidates": ["outline", "activity:42"]
    //   }
    //
    // After:
    //   modelResult = {
    //     "ok": true,
    //     "activity": { "id": 42, "type": "MODULE", "name": "Intro" }
    //   }
    //   state.invalidates += { "outline", "activity:42" }
    const modelResult = extractInvalidationKeys(record.result, state.invalidates);
    session.history.push(formatToolResult(call.call_id, modelResult));
  }

  /**
   * Resolve which session this run targets. Two lookups:
   *  - explicit sessionId (UUID) - client resuming a known conversation
   *  - implicit active pointer (`${userId}:${repoId}`) - the user's
   *    current session for this repo, lazily created if none active
   * If the explicit sessionId is given but missing (expired or never existed),
   * fall through to the implicit lookup so the run still has a session;
   * the client's localStorage will catch up via RunResult.sessionId
   * on the response.
   */
  private async resolveSession(input: RunInput): Promise<AgentSession> {
    const session =
      (input.sessionId && (await sessionStore.get(input.sessionId)))
      || (await sessionStore.getOrCreate(
        input.repository.id,
        input.userId,
        input.mode ?? AgentMode.Edit,
      ));
    session.applyMode(input.mode);
    return session;
  }

  private async callModel(
    systemPrompt: string,
    history: ApiItem[],
    tools: any[],
  ): Promise<{ output: ApiItem[]; error?: string }> {
    try {
      const response = await openaiClient!.responses.create({
        model: aiConfig.modelId!,
        input: [
          { role: ROLE.Developer, content: systemPrompt },
          ...history,
        ] as any,
        tools,
      });
      return { output: response.output || [] };
    } catch (err: any) {
      logger.error(err, 'OpenAI responses.create failed');
      return { output: [], error: err.message };
    }
  }

  /**
   * Parse args, look up the tool, gate by mode, then execute. Each
   * step's failure becomes a structured ToolCallRecord the model can
   * recover from on the next turn.
   */
  private async dispatchTool(
    call: FunctionCall,
    ctx: ToolContext,
    session: AgentSession,
  ): Promise<ToolCallRecord> {
    const parsed = parseToolArgs(call);
    if ('error' in parsed) return failure(call.name, call.arguments, parsed);

    const tool = findTool(call.name);
    if (!tool) return unknownToolFailure(call, parsed.input);

    if (!session.canRun(tool)) {
      return modeBlockedFailure(call, tool, session, parsed.input);
    }

    return this.executeTool(tool, call.name, parsed.input, ctx, session);
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

function appendUserMessage(session: AgentSession, input: RunInput): void {
  session.history.push({ role: ROLE.User, content: input.message });
}

// Push an editor-state preamble describing what the user is currently
// focused on, so the agent can resolve "this", "the topic", etc.
// without an extra read. No-op when the client supplied no focus.
async function appendFocusContext(
  session: AgentSession,
  input: RunInput,
): Promise<void> {
  const header = await buildFocusHeader(input.focus, input.repository);
  if (!header) return;
  session.history.push({ role: ROLE.User, content: header });
}

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

function createRunState(): RunState {
  return { turns: 0, replyText: '', toolCalls: [], invalidates: new Set() };
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

type ParseResult = { input: any } | { error: 'invalid_json'; message: string };

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
 * Tool results may include a server-only `_invalidates` array of cache
 * keys the frontend should refetch. Strip it before forwarding to the
 * model and accumulate it in the run-level set.
 */
function extractInvalidationKeys(result: any, invalidates: Set<string>): any {
  if (!result || typeof result !== 'object') return result;
  if (!('_invalidates' in result)) return result;
  const { _invalidates, ...rest } = result;
  if (Array.isArray(_invalidates)) {
    for (const key of _invalidates) invalidates.add(key);
  }
  return rest;
}

function assembleResult(session: AgentSession, state: RunState): RunResult {
  return {
    sessionId: session.id,
    replyText: state.replyText,
    toolCalls: state.toolCalls,
    turns: state.turns,
    truncated: state.turns >= MAX_TURNS,
    invalidates: Array.from(state.invalidates),
    transactionLog: session.transactionLog,
    pendingQuestion: lastPendingQuestion(state.toolCalls),
  };
}

/**
 * Pick the question the dock should render as a clickable picker.
 *
 * The model can call ask_user_question more than once in
 * a single run (e.g. it asked, retracted, asked something else). The
 * dock can only show one picker at a time, and the natural choice is
 * the most recent successful one - earlier questions are superseded
 * the moment the model emits a new ask.
 */
function lastPendingQuestion(
  toolCalls: ToolCallRecord[],
): RunResult['pendingQuestion'] {
  const last = toolCalls.findLast((tc) => tc.name === PAUSING_TOOL && tc.ok);
  if (!last) return null;
  const input = last.input as any;
  return {
    title: input?.title ?? '',
    question: input?.question ?? '',
    options: input?.options ?? [],
    allowOther: input?.allowOther !== false,
  };
}

export const agentRunner = new AgentRunner();
