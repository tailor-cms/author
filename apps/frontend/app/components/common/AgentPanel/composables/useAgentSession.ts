/**
 * Per-repository transcript persistence for the agent panel. Keyed by
 * the repository UID so a previous database's transcript doesn't
 * resurface under a brand-new repo with the same numeric id (e.g. after
 * a local db reset).
 */
import { useLocalStorage } from '@vueuse/core';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  toolCalls?: any[];
}

export function useAgentSession(repositoryUid: Ref<string | null>) {
  const sessionKey = computed(() =>
    repositoryUid.value ? `agent-panel:session:${repositoryUid.value}` : '',
  );
  const messagesKey = computed(() =>
    repositoryUid.value ? `agent-panel:messages:${repositoryUid.value}` : '',
  );

  const sessionId = useLocalStorage<string | null>(sessionKey, null, {
    writeDefaults: false,
  });
  const messages = useLocalStorage<ChatMessage[]>(messagesKey, [], {
    writeDefaults: false,
  });

  function reset() {
    sessionId.value = null;
    messages.value = [];
  }

  return { sessionId, messages, reset };
}
