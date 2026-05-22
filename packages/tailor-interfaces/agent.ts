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

// A clickable picker the model can attach to a turn via ask_user_question.
// The dock renders it above the input field.
export interface AgentPendingQuestion {
  title: string;
  question: string;
  options: { label: string; prompt: string; hint?: string }[];
  // Whether the picker shows a free-text "Other" row so the user can answer
  // outside the supplied options. true = open question with canned shortcuts;
  // false = strict pick-one (use when the options are exhaustive and a typed
  // answer wouldn't be actionable, e.g. selecting between two existing
  // activity ids). Defaults to true when the model omits it.
  allowOther: boolean;
}
