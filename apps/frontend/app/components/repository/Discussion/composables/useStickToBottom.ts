import type { MaybeRefOrGetter, Ref } from 'vue';
import { useResizeObserver, useScroll } from '@vueuse/core';

// How close to the end still counts as reading the latest messages
const BOTTOM_THRESHOLD_PX = 48;

/**
 * Keeps a message list pinned to its newest entry. Given `startAt`, the
 * list opens at that message instead, and moves to it when it changes.
 * Older messages loaded above leave the reader where they were.
 */
export const useStickToBottom = (
  viewportEl: Ref<HTMLElement | undefined>,
  contentEl: Ref<HTMLElement | undefined>,
  messages: MaybeRefOrGetter<{ id: number }[]>,
  startAt?: MaybeRefOrGetter<number | null | undefined>,
) => {
  const isAtBottom = ref(true);
  // Until the first messages are shown
  let hasStarted = false;

  const scrollToBottom = () => {
    const el = viewportEl.value;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
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
  const { arrivedState, directions } = useScroll(viewportEl, {
    offset: { bottom: BOTTOM_THRESHOLD_PX },
    onScroll: () => {
      if (arrivedState.bottom) isAtBottom.value = true;
      else if (directions.top) isAtBottom.value = false;
    },
  });
  useResizeObserver([viewportEl, contentEl], () => {
    if (isAtBottom.value) scrollToBottom();
  });

  // Measured before the list grows: the distance from the end holds
  const keepOffsetFromEnd = async () => {
    const el = viewportEl.value;
    if (!el) return;
    const fromEnd = el.scrollHeight - el.scrollTop;
    await nextTick();
    el.scrollTop = el.scrollHeight - fromEnd;
  };

  watch(
    [() => toValue(messages).length, () => toValue(messages).at(-1)?.id],
    async ([length, lastId], [prevLength = 0, prevLastId]) => {
      const isOlderPage =
        hasStarted && lastId === prevLastId && length > prevLength;
      if (isOlderPage) return keepOffsetFromEnd();
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
