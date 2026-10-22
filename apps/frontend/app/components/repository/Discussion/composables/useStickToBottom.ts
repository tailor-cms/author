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
  // Where the list was last scrolled to
  let lastScrollTop = 0;

  const scrollToBottom = () => {
    const el = viewportEl.value;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
    lastScrollTop = el.scrollTop;
    isAtBottom.value = true;
  };

  // Only scrolling up leaves the end, not content growing below it
  const onScroll = () => {
    const el = viewportEl.value;
    if (!el) return;
    const isScrollingUp = el.scrollTop < lastScrollTop;
    lastScrollTop = el.scrollTop;
    const rest = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (rest <= BOTTOM_THRESHOLD_PX) isAtBottom.value = true;
    else if (isScrollingUp) isAtBottom.value = false;
  };

  useEventListener(viewportEl, 'scroll', onScroll, { passive: true });
  useResizeObserver([viewportEl, contentEl], () => {
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
