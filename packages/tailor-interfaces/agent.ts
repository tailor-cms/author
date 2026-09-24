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
export type FocusedEntity = typeof Entity.Activity | typeof Entity.ContentElement;

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

// Completed tool call
export type ToolCallRecord =
  | { name: string; input: unknown; result: unknown; ok: true; durationMs: number }
  | { name: string; input: unknown; result: ToolError; ok: false; durationMs: number };

export const RunStatus = {
  Running: 'RUNNING',
  Completed: 'COMPLETED',
  Failed: 'FAILED',
  Cancelled: 'CANCELLED',
} as const;

export type RunStatus = typeof RunStatus[keyof typeof RunStatus];

// Progress reported while a run works, numbered by `seq` so clients can
// ask for only what they haven't seen yet.
// - input: the run picked up a user message
// - message: the model's latest text
// - tool:start / tool:end: a tool call began / finished; `invalidates`
//   lists data the client should refetch
export type RunEvent =
  | { seq: number; type: 'input'; message: string }
  | { seq: number; type: 'message'; text: string }
  | {
    seq: number;
    type: 'tool:start';
    callId: string;
    name: string;
    input: unknown;
  }
  | {
    seq: number;
    type: 'tool:end';
    callId: string;
    call: ToolCallRecord;
    invalidates: string[];
  };

// Reply to POST /agent/runs. `isQueued` means a run was already working
// on this session, so the message joined it instead of starting a new one.
export interface RunStarted {
  runId: string;
  sessionId: string;
  isQueued: boolean;
}

// Summary of a finished run.
export interface RunResult {
  // The model's last reply. Empty when it produced no text.
  replyText: string;
  // Number of model calls the run made.
  turns: number;
  toolCount: number;
  // True when the run hit its turn limit.
  truncated: boolean;
  // Set when the run ended on ask_user_question; the dock renders it as
  // a clickable picker above the input.
  pendingQuestion?: AgentPendingQuestion | null;
}

// A run as seen by a polling client.
export interface RunSnapshot {
  id: string;
  sessionId: string;
  status: RunStatus;
  // Events after the marker the client sent.
  events: RunEvent[];
  result: RunResult | null;
  error: string | null;
}
