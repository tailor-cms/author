import type {
  AgentMode,
  AgentPendingQuestion,
  RunResult,
} from '@tailor-cms/interfaces/agent.ts';
import type { ChatMessage } from './useAgentSession';
import type { ReasoningEffortLiteral } from '@tailor-cms/interfaces/ai.ts';

import aiApi from '@/api/ai';

interface UseAgentRunnerOptions {
  sessionId: Ref<string | null>;
  repositoryId: Ref<number | null>;
  messages: Ref<ChatMessage[]>;
  mode: Ref<AgentMode>;
  effort: Ref<ReasoningEffortLiteral>;
  focusPayload: Ref<unknown>;
  onScroll: () => void;
  onRunStart: () => void;
  onRunEnd: () => void;
}

interface SendResult {
  cancelled: boolean;
}

/**
 * Owns the agent run lifecycle: dispatches the API call, pins the run
 * to the active repository so a mid-flight repository switch can't pollute the new
 * transcript, and surfaces in-flight + result state for the UI.
 */
export function useAgentRunner(opts: UseAgentRunnerOptions) {
  const { $pluginRegistry } = useNuxtApp() as any;

  const isRunning = ref(false);
  const pendingQuestion = ref<AgentPendingQuestion | null>(null);
  const error = ref<string | null>(null);
  const lastTurns = ref<number | null>(null);
  const lastToolCount = ref<number | null>(null);

  /**
   * Reset visible per-run state (running flag, pending question, last
   * error, turn/tool counters). Leaves transcript and sessionId intact;
   * use resetSession() for those.
   */
  function clearRunState() {
    isRunning.value = false;
    pendingQuestion.value = null;
    error.value = null;
    lastTurns.value = null;
    lastToolCount.value = null;
  }

  /**
   * Full reset: wipe the transcript, drop the in-flight state, and ask
   * the backend for a brand-new session.
   * Clearing local state alone isn't enough: the next run posts with no
   * sessionId, which falls through to the backend's getOrCreate and
   * returns the still-active OLD session, resurfacing the history we
   * just "reset". Explicitly creating a new session reassigns the
   * (user, repo) active pointer on the backend so the next run lands on
   * a fresh, empty session.
   */
  async function resetSession(): Promise<void> {
    // Snapshot the id before we null it; needed for the delete call
    // below; once opts.sessionId is null we lose the reference.
    const previousId = opts.sessionId.value;
    // Clear local state up-front so the UI feels responsive.
    opts.sessionId.value = null;
    opts.messages.value = [];
    clearRunState();
    // No repo means no scope for the API calls. Local clear above is
    // still useful (empties the panel); just nothing to do server-side.
    if (!opts.repositoryId.value) return;
    // Fire-and-forget: deleting the old session is housekeeping. If it
    // fails the create below still reassigns the (user, repo) active
    // pointer to the new session via the persist() call, and the
    // orphaned old session ages out via the session TTL.
    if (previousId) {
      aiApi
        .deleteAgentSession(opts.repositoryId.value, previousId)
        .catch(() => {});
    }
    // We need the new id back so the next
    // run posts with sessionId explicitly, bypassing the backend's
    // getOrCreate path that would otherwise resolve to whatever the
    // active pointer happens to point at.
    try {
      const session = await aiApi.createAgentSession(opts.repositoryId.value, {
        mode: opts.mode.value,
      });
      opts.sessionId.value = session.id;
    } catch {
      // Creation failed; sessionId stays null. The next run falls
      // through to backend getOrCreate, which may still resolve to the
      // old session if its delete also failed. Acceptable degradation:
      // user can retry the reset.
    }
  }

  async function send(
    message: string,
    displayLabel?: string,
  ): Promise<SendResult> {
    const text = message.trim();
    if (!text || isRunning.value || !opts.repositoryId.value) {
      return { cancelled: true };
    }

    // Pin the repo for this run
    // so that if the user switches mid-run, the new messages + tool calls
    // go to a new session instead of polluting the in-flight one.
    const runRepoId = opts.repositoryId.value;
    const isStale = () => runRepoId !== opts.repositoryId.value;

    // Optimistic user message. displayLabel covers slash commands;
    // the chat bubble shows the friendly label, but the agent still
    // receives the full prompt.
    pendingQuestion.value = null;
    error.value = null;
    opts.messages.value.push({
      role: 'user',
      content: displayLabel || text,
    });
    opts.onScroll();
    isRunning.value = true;
    opts.onRunStart();

    try {
      const data: RunResult = await aiApi.runAgent(runRepoId, {
        sessionId: opts.sessionId.value || undefined,
        message: text,
        mode: opts.mode.value,
        reasoningEffort: opts.effort.value,
        focus: opts.focusPayload.value,
      });
      if (isStale()) return { cancelled: true };

      opts.sessionId.value = data.sessionId;
      lastTurns.value = data.turns;
      lastToolCount.value = data.toolCalls?.length || 0;
      opts.messages.value.push({
        role: 'assistant',
        content: data.replyText || '(no text response)',
        toolCalls: data.toolCalls,
      });
      pendingQuestion.value = data.pendingQuestion || null;
      opts.onScroll();
      if (data.invalidates?.length) {
        $pluginRegistry.invalidateData();
      }
      return { cancelled: false };
    } catch (err: any) {
      if (isStale()) return { cancelled: true };
      error.value = err?.response?.data?.message || err?.message || 'Failed';
      return { cancelled: false };
    } finally {
      if (!isStale()) {
        isRunning.value = false;
        opts.onRunEnd();
      }
    }
  }

  return {
    isRunning,
    error,
    lastTurns,
    lastToolCount,
    pendingQuestion,
    send,
    clearRunState,
    resetSession,
  };
}
