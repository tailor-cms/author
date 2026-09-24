import {
  type AgentMode,
  type AgentPendingQuestion,
  type RunEvent,
  type RunSnapshot,
  type RunStarted,
  RunStatus,
} from '@tailor-cms/interfaces/agent.ts';
import type { ActiveRun, TranscriptMessage } from './useAgentSession';
import type { ReasoningEffortLiteral } from '@tailor-cms/interfaces/ai.ts';
import { promiseTimeout, useDebounceFn } from '@vueuse/core';

import aiApi from '@/api/ai';

// How long each progress request waits for news (seconds).
const POLL_WAIT = 20;

// Pause before retrying after a failed progress request (ms).
const RETRY_DELAY = 3000;

interface UseAgentRunnerOptions {
  sessionId: Ref<string | null>;
  repositoryId: Ref<number | null>;
  messages: Ref<TranscriptMessage[]>;
  activeRun: Ref<ActiveRun | null>;
  mode: Ref<AgentMode>;
  effort: Ref<ReasoningEffortLiteral>;
  focusPayload: Ref<unknown>;
  // External gate (e.g. a Lens review analyzing the content);
  isBlocked?: Ref<boolean>;
  onScroll: () => void;
}

interface SendResult {
  cancelled: boolean;
}

/**
 * Owns the agent run lifecycle.
 */
export function useAgentRunner(opts: UseAgentRunnerOptions) {
  const { $pluginRegistry } = useNuxtApp() as any;

  const pendingQuestion = ref<AgentPendingQuestion | null>(null);
  const error = ref<string | null>(null);
  const lastTurns = ref<number | null>(null);
  const lastToolCount = ref<number | null>(null);

  const isRunning = computed(() => Boolean(opts.activeRun.value));

  // Tools finish in bursts; refetch once they settle.
  const refreshData = useDebounceFn(() => $pluginRegistry.invalidateData(), 500);

  let isDisposed = false;
  onScopeDispose(() => (isDisposed = true));

  // Each trackRun() takes the next id; an older loop stops even when
  // both track the same run (e.g. after a repo switch and back).
  let latestTrackId = 0;

  function clearRunState() {
    pendingQuestion.value = null;
    error.value = null;
    lastTurns.value = null;
    lastToolCount.value = null;
  }

  /**
   * Full reset: drop transcript, the in-flight state, and ask
   * the backend for a brand-new session.
   */
  async function resetSession(): Promise<void> {
    // Snapshot the id for api call
    const previousId = opts.sessionId.value;
    // Clear local state up-front so the UI feels responsive.
    opts.sessionId.value = null;
    opts.messages.value = [];
    opts.activeRun.value = null;
    clearRunState();
    // No repo means no scope for the API calls.
    if (!opts.repositoryId.value) return;
    // Fire-and-forget; delete old session as housekeeping
    if (previousId) {
      aiApi
        .deleteAgentSession(opts.repositoryId.value, previousId)
        .catch(() => {});
    }
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
    const repositoryId = opts.repositoryId.value;
    if (!text || opts.isBlocked?.value || !repositoryId) {
      return { cancelled: true };
    }
    pendingQuestion.value = null;
    error.value = null;
    opts.messages.value.push({ role: 'user', content: displayLabel || text });
    opts.onScroll();
    try {
      const { runId, sessionId }: RunStarted = await aiApi.startAgentRun(
        repositoryId,
        {
          sessionId: opts.sessionId.value || undefined,
          message: text,
          mode: opts.mode.value,
          reasoningEffort: opts.effort.value,
          focus: opts.focusPayload.value,
        },
      );
      if (repositoryId !== opts.repositoryId.value) return { cancelled: true };
      opts.sessionId.value = sessionId;
      if (opts.activeRun.value?.id !== runId) {
        opts.activeRun.value = { id: runId, repositoryId, lastSeq: 0 };
      }
    } catch (err) {
      error.value = toMessage(err);
    }
    return { cancelled: false };
  }

  async function stop() {
    const run = opts.activeRun.value;
    if (!run) return;
    try {
      await aiApi.cancelAgentRun(run.repositoryId, run.id);
    } catch (err) {
      error.value = toMessage(err);
    }
  }

  /**
   * Track a run until it ends. Each request waits on the server until
   * something happens, so progress shows up as soon as it's reported.
   */
  async function trackRun(runId: string) {
    const trackId = ++latestTrackId;
    const isCurrent = () =>
      !isDisposed &&
      trackId === latestTrackId &&
      opts.activeRun.value?.id === runId;
    while (isCurrent()) {
      const { repositoryId, lastSeq } = opts.activeRun.value!;
      try {
        const run: RunSnapshot = await aiApi.getAgentRun(repositoryId, runId, {
          after: lastSeq,
          wait: POLL_WAIT,
        });
        if (!isCurrent()) return;
        run.events.forEach(applyEvent);
        if (run.events.length) {
          const seq = run.events.at(-1)!.seq;
          opts.activeRun.value = { id: runId, repositoryId, lastSeq: seq };
          opts.onScroll();
        }
        if (run.status !== RunStatus.Running) return finish(run);
      } catch (err: any) {
        if (!isCurrent()) return;
        if (err?.response?.status === 404) return interrupt();
        await promiseTimeout(RETRY_DELAY);
      }
    }
  }

  function applyEvent(event: RunEvent) {
    // Each message the run picks up starts a turn; open an empty
    // reply that the message and tool events below fill in.
    if (event.type === 'input') {
      opts.messages.value.push({ role: 'assistant', content: '', toolCalls: [] });
      return;
    }
    const reply = opts.messages.value.findLast((it) => it.role === 'assistant');
    if (!reply) return;
    const toolCalls = (reply.toolCalls ??= []);
    switch (event.type) {
      case 'message':
        reply.content = event.text;
        break;
      case 'tool:start':
        toolCalls.push({
          callId: event.callId,
          name: event.name,
          input: event.input,
        });
        break;
      case 'tool:end': {
        const index = toolCalls.findIndex((it) => it.callId === event.callId);
        const call = { ...event.call, callId: event.callId };
        if (index < 0) toolCalls.push(call);
        else toolCalls[index] = call;
        if (event.invalidates.length) refreshData();
        break;
      }
    }
  }

  function finish(run: RunSnapshot) {
    opts.activeRun.value = null;
    error.value = run.error;
    if (!run.result) return;
    pendingQuestion.value = run.result.pendingQuestion || null;
    lastTurns.value = run.result.turns;
    lastToolCount.value = run.result.toolCount;
  }

  // The server no longer knows the run, e.g. after a restart
  function interrupt() {
    const reply = opts.messages.value.findLast((it) => it.role === 'assistant');
    if (reply?.toolCalls) {
      reply.toolCalls = reply.toolCalls.filter((it) => it.ok !== undefined);
    }
    opts.activeRun.value = null;
    error.value = 'Renoir was interrupted. Send a message to continue.';
  }

  watch(
    () => opts.activeRun.value?.id,
    (runId) => runId && trackRun(runId),
    { immediate: true },
  );

  return {
    isRunning,
    error,
    lastTurns,
    lastToolCount,
    pendingQuestion,
    send,
    stop,
    clearRunState,
    resetSession,
  };
}

function toMessage(err: any): string {
  return err?.response?.data?.message || err?.message || 'Failed';
}
