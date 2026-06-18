import { nextTick, type Ref } from 'vue';

import { useEventListener, useLocalStorage } from '@vueuse/core';

const STORAGE_KEY = 'agent-panel:open';

interface UsePanelVisibilityOptions {
  isEnabled: Ref<unknown>;
  inputEl: Ref<{ focus: () => void } | null>;
}

/**
 * Owns the docked panel's open/close state and the Cmd+K toggle. The panel
 * is a persistent drawer, so it stays open until explicitly dismissed (no
 * click-outside auto-collapse).
 */
export function usePanelVisibility(opts: UsePanelVisibilityOptions) {
  const { inputEl, isEnabled } = opts;
  const isOpen = useLocalStorage(STORAGE_KEY, false);

  function open() {
    isOpen.value = true;
    // Wait for the panel to mount, then drop the cursor in the input so
    // the user can type immediately and press Enter to send.
    nextTick(() => inputEl.value?.focus());
  }

  function close() {
    isOpen.value = false;
  }

  function toggle() {
    if (isOpen.value) close();
    else open();
  }

  useEventListener(window, 'keydown', (e: KeyboardEvent) => {
    if (!isEnabled.value) return;
    if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== 'k') return;
    e.preventDefault();
    toggle();
  });

  return { isOpen, open, close, toggle };
}
