// Shared protocol contracts for the embedded authoring agent.

// Autonomy level for a session. Controls how aggressively the agent
// executes write tools without confirmation:
// - AUTO: model executes write tools without prompting
// - SAFE: write tools surface a confirmation step in the dock (default)
// - MANUAL: model proposes plans only; the user runs each step explicitly
export const AgentMode = {
  Auto: 'AUTO',
  Safe: 'SAFE',
  Manual: 'MANUAL',
} as const;
export type AgentMode = typeof AgentMode[keyof typeof AgentMode];
export const AGENT_MODES = Object.values(AgentMode);

// What the user is currently looking at in the editor. Sent on each run so
// the agent can resolve pronouns ("this", "the topic") without an extra read.
export interface FocusedTarget {
  type: 'activity' | 'container' | 'element';
  id: number;
  // Optional human-readable hints, included verbatim in the per-turn header.
  label?: string;
  activityType?: string;
}

// A clickable picker the model can attach to a turn via ask_user_question.
// The dock renders it above the input field.
export interface AgentPendingQuestion {
  title: string;
  question: string;
  options: { label: string; prompt: string; hint?: string }[];
  allowOther: boolean;
}
