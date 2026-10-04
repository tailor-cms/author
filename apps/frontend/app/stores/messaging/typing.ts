import { api } from '@/api';

// How long a "typing" signal lasts without a fresh one
const TYPING_TTL = 4000;

interface TypingEvent {
  threadId: number;
  user?: { id: number; label?: string };
}

// Who is typing in which thread, from other people's signals
export const createTypingIndicator = () => {
  const typing = reactive(new Map<number, { label: string; at: number }>());

  const typingUsers = computed(() => {
    const cutoff = Date.now() - TYPING_TTL;
    return Array.from(typing.entries())
      .filter(([, it]) => it.at > cutoff)
      .map(([id, it]) => ({ id, label: it.label }));
  });

  function reportTyping(repositoryId: number, threadId: number) {
    return api.messaging.reportTyping({
      params: { repositoryId },
      body: { threadId },
    });
  }

  function onTyping({ threadId, user }: TypingEvent) {
    typing.set(threadId, { label: user?.label ?? 'Someone', at: Date.now() });
  }

  const clear = () => typing.clear();

  return { typingUsers, reportTyping, onTyping, clear };
};
