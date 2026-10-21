import type { MaybeRefOrGetter, Ref } from 'vue';
import { useEventListener, useResizeObserver } from '@vueuse/core';

// How close to the end still counts as reading the latest messages
const BOTTOM_THRESHOLD_PX = 48;

/**
 * Keeps a message list pinned to its newest entry.
 */
export const useStickToBottom = (
  viewportEl: Ref<HTMLElement | undefined>,
  contentEl: Ref<HTMLElement | undefined>,
  messages: MaybeRefOrGetter<unknown[]>,
) => {
  const isAtBottom = ref(true);

  const scrollToBottom = () => {
    const el = viewportEl.value;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
    isAtBottom.value = true;
  };

  const onScroll = () => {
    const el = viewportEl.value;
    if (!el) return;
    const rest = el.scrollHeight - el.scrollTop - el.clientHeight;
    isAtBottom.value = rest <= BOTTOM_THRESHOLD_PX;
  };

  useEventListener(viewportEl, 'scroll', onScroll, { passive: true });
  useResizeObserver(contentEl, () => {
    if (isAtBottom.value) scrollToBottom();
  });

  watch(
    () => toValue(messages).length,
    async () => {
      await nextTick();
      scrollToBottom();
    },
    { immediate: true },
  );
};
