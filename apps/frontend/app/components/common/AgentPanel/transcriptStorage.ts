/**
 * Manages the storage of agent panel transcripts in localStorage, ensuring
 * that only a limited number of recent messages are kept, without tool
 * inputs and results, to avoid exceeding storage quotas.
 */
import type {
  TranscriptMessage,
  TranscriptToolCall,
} from './composables/useAgentSession';

// Older conversation beyond this is only kept until reload
const MAX_STORED_MESSAGES = 40;

// Bump in case of structural changes
const STORAGE_VERSION = 2;

// Transcript keys of any version, e.g. `agent-panel:v2:messages:<uid>`.
const VERSIONED_KEY = /^agent-panel:v(\d+):/;

// Keys from before versioning: the old dock and unversioned panel keys.
const UNVERSIONED_KEY = /^(agent-dock:|agent-panel:(session|messages|run):)/;

export function transcriptKey(name: string, repositoryUid: string): string {
  return `agent-panel:v${STORAGE_VERSION}:${name}:${repositoryUid}`;
}

export function serializeTranscript(
  messages: TranscriptMessage[],
  limit = MAX_STORED_MESSAGES,
): string {
  return JSON.stringify(messages.slice(-limit).map(toStoredMessage));
}

export function saveTrimmedTranscript(
  key: string,
  messages: TranscriptMessage[],
): void {
  let limit = Math.min(messages.length, MAX_STORED_MESSAGES);
  while (limit > 1) {
    // Halve on each try, keeping the most recent messages; a few tries
    // reach a size that fits, 40 -> 20 -> 10 -> 5 -> 3 -> 2 -> 1.
    limit = Math.ceil(limit / 2);
    if (safeSet(key, serializeTranscript(messages, limit))) return;
  }
  // If nothing fits, remove the saved transcript.
  safeRemove(key);
}

export function removeLegacyKeys(): void {
  try {
    Object.keys(localStorage)
      .filter(isOutdatedStorageKey)
      .forEach((key) => localStorage.removeItem(key));
  } catch {
    // Storage unavailable (e.g. blocked site data); nothing to clean.
  }
}

export function isQuotaError(err: unknown): boolean {
  return err instanceof DOMException && err.name === 'QuotaExceededError';
}

function isOutdatedStorageKey(key: string): boolean {
  if (UNVERSIONED_KEY.test(key)) return true;
  const version = VERSIONED_KEY.exec(key)?.[1];
  return version !== undefined && Number(version) < STORAGE_VERSION;
}

function toStoredMessage(message: TranscriptMessage): TranscriptMessage {
  if (!message.toolCalls) return message;
  return { ...message, toolCalls: message.toolCalls.map(toStoredCall) };
}

function toStoredCall({
  input: _input,
  result: _result,
  ...call
}: TranscriptToolCall): TranscriptToolCall {
  return call;
}

function safeSet(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function safeRemove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // Nothing more to do; the in-memory transcript still works.
  }
}
