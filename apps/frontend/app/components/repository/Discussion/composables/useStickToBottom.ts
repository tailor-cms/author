import type { MaybeRefOrGetter, Ref } from 'vue';
import { useEventListener, useResizeObserver } from '@vueuse/core';

// How close to the end still counts as reading the latest messages
const BOTTOM_THRESHOLD_PX = 48;

/**
 * Keeps a message list pinned to its newest entry. Given `startAt`, the
 * list opens at that message instead, and moves to it when it changes.
 */
export const useStickToBottom = (
  viewportEl: Ref<HTMLElement | undefined>,
  contentEl: Ref<HTMLElement | undefined>,
  messages: MaybeRefOrGetter<unknown[]>,
  startAt?: MaybeRefOrGetter<number | null | undefined>,
) => {
  const isAtBottom = ref(true);
  // Where the list was last scrolled to
  let lastScrollTop = 0;
  // Until the first messages are shown
  let hasStarted = false;

  const scrollToBottom = () => {
    const el = viewportEl.value;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
    lastScrollTop = el.scrollTop;
    isAtBottom.value = true;
  };

  // At the requested message, if it is in the list, otherwise the end
  const scrollToStart = () => {
    const id = toValue(startAt);
    const selector = `[data-message-id="${id}"]`;
    const row = id && viewportEl.value?.querySelector(selector);
    if (!row) return scrollToBottom();
    row.scrollIntoView({ block: 'center' });
    isAtBottom.value = false;
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
    async (length) => {
      await nextTick();
      if (hasStarted) return scrollToBottom();
      if (!length) return;
      hasStarted = true;
      scrollToStart();
    },
    { immediate: true },
  );

  // A list already showing moves to a newly requested message
  watch(
    () => toValue(startAt),
    (id) => id && hasStarted && scrollToStart(),
    { flush: 'post' },
  );
};
