import { api } from '@/api';

// How long a "typing" signal lasts without a fresh one
const TYPING_TTL = 4000;

interface TypingEvent {
  threadId: number;
  user?: { id: number; label?: string };
}

// Who is typing in which thread, from other people's signals
export const createTypingIndicator = () => {
  const typing = reactive(new Map<number, { label: string }>());
  const expiries = new Map<number, ReturnType<typeof setTimeout>>();

  const typingUsers = computed(() =>
    Array.from(typing.entries(), ([id, it]) => ({ id, label: it.label })),
  );

  function reportTyping(repositoryId: number, threadId: number) {
    return api.messaging.reportTyping({
      params: { repositoryId },
      body: { threadId },
    });
  }

  function onTyping({ threadId, user }: TypingEvent) {
    typing.set(threadId, { label: user?.label ?? 'Someone' });
    clearTimeout(expiries.get(threadId));
    expiries.set(
      threadId,
      setTimeout(() => {
        typing.delete(threadId);
        expiries.delete(threadId);
      }, TYPING_TTL),
    );
  }

  function clear() {
    expiries.forEach((it) => clearTimeout(it));
    expiries.clear();
    typing.clear();
  }

  return { typingUsers, reportTyping, onTyping, clear };
};
