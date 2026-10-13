// Wire shape for an agent run.
import { AgentMode, RunId, SessionId } from './entity.ts';
import {
  Int,
  RepositoryScopedParams,
  UInt,
  UIntParam,
} from '#shared/request/schemas.ts';
import { Entity } from '@tailor-cms/interfaces/revision.ts';
import { ReasoningEffort } from '@tailor-cms/interfaces/ai.ts';
import { RunStatus } from '@tailor-cms/interfaces/agent.ts';
import { oneLine } from 'common-tags';
import { z } from 'zod';

// Longest a run state request may wait for new events.
export const MAX_WAIT_SECONDS = 25;

// One entry in the editor's focus context - what the user is looking at
// when they send the message. Lets the agent resolve "this" / "the topic"
// without an extra read.
export const FocusedTarget = z
  .object({
    kind: z
      .enum([Entity.Activity, Entity.ContentElement])
      .describe('Discriminator from the canonical Entity vocabulary.'),
    id: Int().describe(oneLine`
      Target id. For embedded sub-elements (no row of their own),
      this is the PARENT element id; \`embedUid\` then selects the sub-piece.
    `),
    type: z
      .string()
      .optional()
      .describe(`Mirror of the entity's \`type\` column.`),
    embedUid: z
      .string()
      .optional()
      .describe('Sub-element selector when `id` points at the parent row.'),
    label: z.string().optional().describe('Display label, if available.'),
  })
  .meta({ id: 'AgentFocusedTarget' });

export type FocusedTarget = z.infer<typeof FocusedTarget>;

export const RunInput = z
  .object({
    sessionId: SessionId().optional().describe(oneLine`
      Existing session to append a turn to. Omit to start a fresh
      session (the response carries the new \`sessionId\`).
    `),
    message: z.string().trim().min(1).describe('User message for this turn.'),
    mode: z.enum(AgentMode).optional().describe(oneLine`
      Per-turn mode override; lets the dock honour the current picker
      selection on resumed conversations.
    `),
    focus: z.array(FocusedTarget).optional().describe(oneLine`
      Editor focus context. The agent uses this to resolve pronouns
      without extra reads.
    `),
    reasoningEffort: z.enum(ReasoningEffort).optional().describe(oneLine`
      Reasoning effort. Honoured only when the configured model
      accepts \`reasoning.effort\` (gpt-5 / o-series).
    `),
  })
  .describe('Single-turn agent run payload.');

export type RunInput = z.infer<typeof RunInput>;

// Structured error envelope every failed tool call produces. Open shape
// (`looseObject`) because each tool decides what extra context to attach
// (scope/mode for `mode_denied`, allowedElementTypes for `invalid_type`,
// etc.).
const ToolError = z
  .looseObject({
    error: z
      .string()
      .describe('Error code (e.g. `mode_denied`, `invalid_json`).'),
    message: z.string().describe('Human-readable description of the failure.'),
  })
  .meta({ id: 'AgentToolError' })
  .describe('Structured failure envelope returned by tools.');

// Fields shared by both branches of `ToolCallRecord`.
const ToolCallBase = {
  name: z
    .string()
    .describe('Tool name as registered in the agent toolset.'),
  durationMs: UInt().describe('Tool call duration in milliseconds.'),
};

// One entry in the per-turn tool-call log. Discriminated on `ok` so
// consumers narrow `result` without manual casts.
const ToolCallRecord = z
  .union([
    z.object({
      ...ToolCallBase,
      ok: z.literal(true),
      input: z.unknown().describe('Parsed JSON args the model produced.'),
      result: z.unknown().describe('Tool-specific success payload.'),
    }),
    z.object({
      ...ToolCallBase,
      ok: z.literal(false),
      input: z.unknown().describe(oneLine`
        Parsed JSON args, or - on \`invalid_json\` - the raw arguments
        string the model emitted.
      `),
      result: ToolError,
    }),
  ])
  .meta({ id: 'AgentToolCallRecord' })
  .describe('Single tool-call audit row from a run turn.');

// One option in an `AgentPendingQuestion`. The dock renders these as
// clickable picker rows above the input field.
const PendingQuestionOption = z
  .object({
    label: z.string().describe('Picker label rendered to the user.'),
    prompt: z.string().describe('Prompt sent back to the agent when picked.'),
    hint: z
      .string()
      .optional()
      .describe('Optional secondary hint under the label.'),
  })
  .meta({ id: 'AgentPendingQuestionOption' });

// A clickable picker the model can attach to a turn via
// `ask_user_question`.
const PendingQuestion = z
  .object({
    title: z.string().describe('Picker header.'),
    question: z.string().describe('Question body.'),
    options: z
      .array(PendingQuestionOption)
      .describe('Answer options the user can click.'),
    allowOther: z.boolean().describe(oneLine`
      Whether the picker shows a free-text "Other" row. true = open
      question with shortcuts; false = strict pick-one.
    `),
  })
  .meta({ id: 'AgentPendingQuestion' })
  .describe('Clickable picker the model can attach to a turn.');

// Summary of a finished run; tool calls arrive earlier as events.
const RunResult = z
  .object({
    replyText: z.string().describe(`The model's final reply.`),
    turns: UInt().describe('Number of model calls the run made.'),
    toolCount: UInt().describe('Number of tool calls the run made.'),
    truncated: z.boolean().describe('True when the run hit its turn limit.'),
    pendingQuestion: PendingQuestion.nullable().optional().describe(oneLine`
      Set when the run ended on \`ask_user_question\`; the dock renders
      it as a clickable picker above the input.
    `),
  })
  .meta({ id: 'AgentRunResult' })
  .describe('Summary of agent run.');

const SharedEventAttrs = {
  seq: Int().describe('Event number, starting at 1.'),
};

const RunEvent = z
  .discriminatedUnion('type', [
    z.object({
      ...SharedEventAttrs,
      type: z.literal('input'),
      message: z.string().describe('User message the run picked up.'),
    }),
    z.object({
      ...SharedEventAttrs,
      type: z.literal('message'),
      text: z.string().describe(`The model's latest text.`),
    }),
    z.object({
      ...SharedEventAttrs,
      type: z.literal('tool:start'),
      callId: z.string(),
      name: z.string(),
      input: z.unknown(),
    }),
    z.object({
      ...SharedEventAttrs,
      type: z.literal('tool:end'),
      callId: z.string(),
      call: ToolCallRecord,
      invalidates: z.array(z.string()).describe(oneLine`
        Data the client should refetch (e.g. \`activity:42\`, \`outline\`).
      `),
    }),
  ])
  .meta({ id: 'AgentRunEvent' })
  .describe('Progress reported while a run works.');

export const RunStarted = z
  .object({
    runId: RunId(),
    sessionId: SessionId(),
    isQueued: z.boolean().describe(oneLine`
      True when the message joined a run already working on this
      session instead of starting a new one; \`runId\` is that run.
    `),
  })
  .meta({ id: 'AgentRunStarted' });

export const RunSnapshot = z
  .object({
    id: RunId(),
    sessionId: SessionId(),
    status: z.enum(RunStatus),
    events: z.array(RunEvent).describe('Events after the requested marker.'),
    result: RunResult.nullable().describe('Set once ended.'),
    error: z.string().nullable().describe('Set when failed.'),
  })
  .meta({ id: 'AgentRunSnapshot' })
  .describe('State of a run at a specific point in time.');

export const RunItemParams = RepositoryScopedParams.extend({
  runId: RunId(),
});

export const RunSnapshotQuery = z.object({
  after: UIntParam().optional().describe(oneLine`
    Return events after this marker. Defaults to 0 (all).
  `),
  wait: UIntParam().max(MAX_WAIT_SECONDS).optional().describe(oneLine`
    Seconds to hold the request until a new event arrives or the run
    ends. Defaults to 0 (immediately).
  `),
});
