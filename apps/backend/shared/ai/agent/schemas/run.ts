// Wire shape for an agent run.
import { AgentMode, AgentTransactionLog, SessionId } from './entity.ts';
import { Int, UInt } from '#shared/request/schemas.ts';
import { Entity } from '@tailor-cms/interfaces/revision.ts';
import { oneLine } from 'common-tags';
import { ReasoningEffort } from '@tailor-cms/interfaces/ai.ts';
import { z } from 'zod';

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

// Wire response shape for `POST /agent/run`.
export const RunResult = z
  .object({
    sessionId: SessionId().describe('Session this turn ran against.'),
    replyText: z.string().describe(oneLine`
      Assistant's reply text after the loop ended (the model's last
      text-only message). Empty string when the run produced no text.
    `),
    toolCalls: z
      .array(ToolCallRecord)
      .describe('Tool-call audit log for this turn.'),
    turns: UInt().describe(
      'Number of (model call -> tool dispatch) iterations the loop ran.',
    ),
    truncated: z.boolean().describe(oneLine`
      True when the run was cut off (today only by maxTurns).
    `),
    invalidates: z.array(z.string()).describe(oneLine`
      Namespaced cache keys the client should refetch after this run
      (e.g. \`activity:42\`, \`element:17\`, \`outline\`, \`assets\`).
      Emitted by write-tools via their internal \`_invalidates\` field.
    `),
    transactionLog: AgentTransactionLog.describe(
      'Cumulative write-operation log across the whole session.',
    ),
    pendingQuestion: PendingQuestion.nullable().optional().describe(oneLine`
      Most recent \`ask_user_question\` call (if any); the dock renders
      it as a clickable picker above the input.
    `),
  })
  .meta({ id: 'AgentRunResult' })
  .describe('Result of a single agent turn.');

export type RunResult = z.infer<typeof RunResult>;
