import { useLocalStorage } from '@vueuse/core';

// A tool call in the transcript. `ok` is missing while it still runs.
export interface TranscriptToolCall {
  callId?: string;
  name: string;
  input: unknown;
  ok?: boolean;
  result?: unknown;
  durationMs?: number;
}

export interface TranscriptMessage {
  role: 'user' | 'assistant';
  content: string;
  toolCalls?: TranscriptToolCall[];
}

// The run in progress
export interface ActiveRun {
  id: string;
  repositoryId: number;
  lastSeq: number;
}

export function useAgentSession(repositoryUid: Ref<string | null>) {
  const storageKey = (name: string) =>
    computed(() =>
      repositoryUid.value ? `agent-panel:${name}:${repositoryUid.value}` : '',
    );

  const sessionId = useLocalStorage<string | null>(storageKey('session'), null, {
    writeDefaults: false,
  });
  const messages = useLocalStorage<TranscriptMessage[]>(storageKey('messages'), [], {
    writeDefaults: false,
  });
  const activeRun = useLocalStorage<ActiveRun | null>(storageKey('run'), null, {
    writeDefaults: false,
    serializer: {
      read: (raw) => (raw ? JSON.parse(raw) : null),
      write: (value) => JSON.stringify(value),
    },
  });

  function reset() {
    sessionId.value = null;
    messages.value = [];
    activeRun.value = null;
  }

  return { sessionId, messages, activeRun, reset };
}
