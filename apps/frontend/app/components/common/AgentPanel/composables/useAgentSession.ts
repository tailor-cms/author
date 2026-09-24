import { useLocalStorage } from '@vueuse/core';

import {
  isQuotaError,
  removeLegacyKeys,
  saveTrimmedTranscript,
  serializeTranscript,
  transcriptKey,
} from '../transcriptStorage';

// A tool call in the transcript. `ok` is missing while it still runs.
export interface TranscriptToolCall {
  callId: string;
  name: string;
  ok?: boolean;
  // Input and result are kept in memory only;
  // Only label and summary are saved.
  input?: unknown;
  result?: unknown;
  label?: string;
  summary?: string;
  durationMs?: number;
}

export interface TranscriptMessage {
  role: 'user' | 'assistant';
  content: string;
  toolCalls?: TranscriptToolCall[];
  runId?: string;
  inputSeq?: number;
}

// The run in progress
export interface ActiveRun {
  id: string;
  repositoryId: number;
  lastSeq: number;
}

export function useAgentSession(repositoryUid: Ref<string | null>) {
  removeLegacyKeys();

  const storageKey = (name: string) =>
    computed(() =>
      repositoryUid.value ? transcriptKey(name, repositoryUid.value) : '',
    );

  const sessionId = useLocalStorage<string | null>(storageKey('session'), null, {
    writeDefaults: false,
  });

  const messagesKey = storageKey('messages');
  const messages = useLocalStorage<TranscriptMessage[]>(messagesKey, [], {
    writeDefaults: false,
    serializer: {
      read: (raw) => (raw ? JSON.parse(raw) : []),
      write: (value) => serializeTranscript(value),
    },
    // If full should not freeze transcript at an old state;
    onError: (err) => {
      if (!isQuotaError(err) || !messagesKey.value) return console.error(err);
      saveTrimmedTranscript(messagesKey.value, messages.value);
    },
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
