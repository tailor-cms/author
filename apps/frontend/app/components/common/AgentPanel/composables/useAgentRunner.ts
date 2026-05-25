import type {
  AgentMode,
  AgentPendingQuestion,
  RunResult,
} from '@tailor-cms/interfaces/agent.ts';
import type { ChatMessage } from './useAgentSession';
import type { ReasoningEffortLiteral } from '@tailor-cms/interfaces/ai.ts';

import aiApi from '@/api/ai';
import { useActivityStore } from '@/stores/activity';

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
  const activityStore = useActivityStore();

  const isRunning = ref(false);
  const pendingQuestion = ref<AgentPendingQuestion | null>(null);
  const error = ref<string | null>(null);
  const lastTurns = ref<number | null>(null);
  const lastToolCount = ref<number | null>(null);

  function reset() {
    isRunning.value = false;
    pendingQuestion.value = null;
    error.value = null;
    lastTurns.value = null;
    lastToolCount.value = null;
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
        await activityStore.fetch(runRepoId);
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
    reset,
  };
}
