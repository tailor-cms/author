import type { MaybeRefOrGetter, Ref } from 'vue';
import { find, isEqual, some } from 'lodash-es';
import { useResizeObserver, useScroll } from '@vueuse/core';

// How close to the end still counts as reading the latest messages
const BOTTOM_THRESHOLD_PX = 48;

// What the list's scroll position follows
interface ListState {
  length: number;
  firstId?: number;
  hasNewer: boolean;
  // The requested message, once it is in the list
  startId: number | null;
}

/**
 * Keeps a message list pinned to its newest entry. Given `startAt`, the
 * list opens at that message instead, and moves to it when it changes or
 * the list reloads. Pages loaded at either end leave the reader where
 * they were; while `hasNewer`, the end is not the newest, so nothing
 * pins to it.
 */
export const useStickToBottom = (
  viewportEl: Ref<HTMLElement | undefined>,
  contentEl: Ref<HTMLElement | undefined>,
  messages: MaybeRefOrGetter<{ id: number }[]>,
  startAt?: MaybeRefOrGetter<number | null | undefined>,
  hasNewer?: MaybeRefOrGetter<boolean>,
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

  const findRow = (id?: number | string | null) =>
    id ? viewportEl.value?.querySelector(`[data-message-id="${id}"]`) : null;

  // At the requested message, if it is in the list, otherwise the end
  const scrollToStart = () => {
    const row = findRow(toValue(startAt));
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
    if (isAtBottom.value && !toValue(hasNewer)) scrollToBottom();
  });

  // The first row in view that stays listed, and how far below the top of
  // the list it sits; rows outside the list, like a reply panel's parent,
  // don't move with it
  const findAnchor = () => {
    const el = viewportEl.value;
    if (!el) return;
    const listed = new Set(toValue(messages).map((it) => String(it.id)));
    const top = el.getBoundingClientRect().top;
    const rows = el.querySelectorAll<HTMLElement>('[data-message-id]');
    const row = find(
      rows,
      (it) =>
        listed.has(it.dataset.messageId ?? '') &&
        it.getBoundingClientRect().bottom > top,
    );
    if (!row) return;
    const offset = row.getBoundingClientRect().top - top;
    return { id: row.dataset.messageId, offset };
  };

  // Rows loaded or unloaded around the reader leave the one in view where
  // it was; if it is gone, the list was reloaded elsewhere. Measured
  // before the list renders
  const keepAnchor = async () => {
    const anchor = findAnchor();
    await nextTick();
    const el = viewportEl.value;
    const row = anchor && findRow(anchor.id);
    if (!el || !row) return scrollToStart();
    const viewportTop = el.getBoundingClientRect().top;
    const top = row.getBoundingClientRect().top - viewportTop;
    el.scrollTop += top - anchor.offset;
  };

  const listState = computed<ListState>((prev) => {
    const list = toValue(messages);
    const id = toValue(startAt);
    const next = {
      length: list.length,
      firstId: list[0]?.id,
      hasNewer: !!toValue(hasNewer),
      startId: id && some(list, { id }) ? id : null,
    };
    // Nothing changed: the same object, so the watcher doesn't run
    return prev && isEqual(prev, next) ? prev : next;
  });

  watch(
    listState,
    async (now, prev) => {
      if (!hasStarted || !prev) {
        await nextTick();
        if (!now.length) return;
        hasStarted = true;
        return scrollToStart();
      }
      // A message was requested, or its page just came in
      if (now.startId && now.startId !== prev.startId) {
        await nextTick();
        return scrollToStart();
      }
      if (now.length > prev.length && now.firstId === prev.firstId) {
        // A newer page, below the reader
        if (prev.hasNewer) return;
        // A new message at the end
        await nextTick();
        return scrollToBottom();
      }
      // At the newest, a new message that unloaded the oldest keeps it there
      if (isAtBottom.value && !now.hasNewer) {
        await nextTick();
        return scrollToBottom();
      }
      // Pages loaded or unloaded around the reader, or reloaded elsewhere
      return keepAnchor();
    },
    { immediate: true },
  );
};
