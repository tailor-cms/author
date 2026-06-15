import { clamp } from 'lodash-es';
import { useLocalStorage } from '@vueuse/core';

interface DrawerResizeOptions {
  // Which screen edge the drawer is attached to
  side: 'left' | 'right';
  // localStorage key persisting the user-chosen width
  storageKey: string;
  // Width used until the user resizes (can be display-responsive)
  defaultWidth: MaybeRefOrGetter<number>;
  minWidth?: number;
  maxWidth?: number;
}

/**
 * Drag-to-resize support for a navigation drawer.
 */
export const useDrawerResize = (options: DrawerResizeOptions) => {
  const minWidth = options.minWidth ?? 320;
  const maxWidth = options.maxWidth ?? 720;
  const storedWidth = useLocalStorage(options.storageKey, 0);
  const liveWidth = ref(0);
  const isResizing = ref(false);

  let dragOrigin = { x: 0, width: 0 };

  const width = computed(() => {
    if (isResizing.value) return liveWidth.value;
    const base = storedWidth.value || toValue(options.defaultWidth);
    return clamp(base, minWidth, maxWidth);
  });

  const onPointerMove = (event: PointerEvent) => {
    const delta =
      options.side === 'left'
        ? event.clientX - dragOrigin.x
        : dragOrigin.x - event.clientX;
    const max = Math.min(maxWidth, Math.round(window.innerWidth / 2));
    liveWidth.value = clamp(
      Math.round(dragOrigin.width + delta),
      minWidth,
      max,
    );
  };

  const stopResize = (event: PointerEvent) => {
    if (!isResizing.value) return;
    isResizing.value = false;
    storedWidth.value = liveWidth.value;
    const handle = event.currentTarget as HTMLElement;
    handle.removeEventListener('pointermove', onPointerMove);
    handle.removeEventListener('lostpointercapture', stopResize);
    restoreBodyStyles();
  };

  const startResize = (event: PointerEvent) => {
    event.preventDefault();
    // Snapshot before flipping isResizing
    dragOrigin = { x: event.clientX, width: width.value };
    liveWidth.value = dragOrigin.width;
    isResizing.value = true;
    const handle = event.currentTarget as HTMLElement;
    handle.setPointerCapture(event.pointerId);
    handle.addEventListener('pointermove', onPointerMove);
    handle.addEventListener('lostpointercapture', stopResize);
    document.body.style.setProperty('cursor', 'col-resize');
    document.body.style.setProperty('user-select', 'none');
  };

  const restoreBodyStyles = () => {
    document.body.style.removeProperty('cursor');
    document.body.style.removeProperty('user-select');
  };

  // Mid-drag unmount removes the handle (and its listeners)
  onBeforeUnmount(restoreBodyStyles);

  return { width, isResizing, startResize };
};
