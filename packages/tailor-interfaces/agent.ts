// Shared protocol contracts for the embedded authoring agent.
import type { Entity } from './revision';

// Autonomy level for a session. Two tiers:
// - INSPECT: read-only; the agent can observe, plan, and ask, but
//   any write/generate/destructive tool is blocked. The user is in
//   control of every change.
// - EDIT: full autonomy; the agent can read, write, generate, AND
//   delete. Recoverable via soft-delete + restore_activity and the
//   session's transactionLog.
export const AgentMode = {
  Inspect: 'INSPECT',
  Edit: 'EDIT',
} as const;

export type AgentMode = typeof AgentMode[keyof typeof AgentMode];

export const AGENT_MODES = Object.values(AgentMode);

// Entity kinds the editor can put under focus. Subset of the canonical
// `Entity` enum (revision.ts) - REPOSITORY is implicit (the run is already
// scoped to one) and "container" isn't a separate kind at the DB level
// (containers are activities; the `type` field below disambiguates them).
export type FocusedEntity = Entity.Activity | Entity.ContentElement;

// What the user is currently looking at in the editor. Sent on each run so
// the agent can resolve pronouns ("this", "the topic") without an extra read.
//
// Naming notes:
// - `kind` is the discriminator, reusing the canonical Entity vocabulary
//   ('ACTIVITY' / 'CONTENT_ELEMENT') used by revisions and the audit log.
// - `type` mirrors the entity's own `type` column (e.g. 'TOPIC',
//   'STRUCTURED_CONTENT', 'MULTIPLE_CHOICE') so the agent can resolve
//   "this question" without a follow-up read.
// - `id` always points at a DB row. Embedded sub-elements have no DB
//   row of their own - in that case `id` is the PARENT element's id and
//   `embedUid` selects the sub-piece.
export interface FocusedTarget {
  kind: FocusedEntity;
  type?: string;
  id: number;
  embedUid?: string;
  label?: string;
}

// One option in an AgentPendingQuestion. The `prompt` is what gets sent
// back to the agent when the user picks this option; `label` is what the
// picker UI renders;
export interface AgentQuestionOption {
  label: string;
  prompt: string;
  hint?: string;
}

// A clickable picker the model can attach to a turn via ask_user_question.
// The dock renders it above the input field.
export interface AgentPendingQuestion {
  title: string;
  question: string;
  options: AgentQuestionOption[];
  // Whether the picker shows a free-text "Other" row so the user can answer
  // outside the supplied options. true = open question with canned shortcuts;
  // false = strict pick-one (use when the options are exhaustive and a typed
  // answer wouldn't be actionable, e.g. selecting between two existing
  // activity ids). Defaults to true when the model omits it.
  allowOther: boolean;
}

// Structured error envelope every failed tool call produces. Mode-denied,
// invalid-json, unknown-tool, tool-threw, and any tool using the backend's
// toolError helper all share this shape, so { error, message } is reliable
// across the failure path.
export interface ToolError {
  error: string;
  message: string;
  // Tool-specific extras: scope/mode for mode_denied, allowedElementTypes
  // for invalid_type, etc. Not enumerated here because each tool decides.
  [extra: string]: unknown;
}

// One entry in RunResult.toolCalls. Discriminated on `ok` so consumers
// narrow `result` without manual casts:
//   if (tc.ok) tc.result.someSuccessField   // tool-specific success shape
//   else       tc.result.error              // ToolError
// `input` is intentionally `unknown`: usually parsed JSON args, but on
// invalid_json it's the raw arguments string the model emitted.
export type ToolCallRecord =
  | { name: string; input: unknown; result: unknown; ok: true; durationMs: number }
  | { name: string; input: unknown; result: ToolError; ok: false; durationMs: number };

// Shape of an /agent/run response. Backend may include richer
// audit data in `transactionLog`;
export interface RunResult {
  sessionId: string;
  // Assistant's reply text after the loop ended (the model's last
  // text-only message). Empty string when the run produced no text.
  replyText: string;
  toolCalls: ToolCallRecord[];
  // Number of (model call -> tool dispatch) iterations the loop ran.
  turns: number;
  // True when the run was cut off (today only by maxTurns).
  truncated: boolean;
  // Cache keys the frontend should refetch after this run.
  invalidates: string[];
  // Cumulative operations across the whole session;
  transactionLog: unknown[];
  // The most recent ask_user_question call (if any); the dock renders
  // it as a clickable picker above the input.
  pendingQuestion?: AgentPendingQuestion | null;
}
