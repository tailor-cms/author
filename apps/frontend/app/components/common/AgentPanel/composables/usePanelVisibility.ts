import { nextTick, type Ref } from 'vue';

import {
  onClickOutside,
  useEventListener,
  useLocalStorage,
} from '@vueuse/core';

const STORAGE_KEY = 'agent-panel:open';

interface UsePanelVisibilityOptions {
  isEnabled: Ref<unknown>;
  rootEl: Ref<HTMLElement | null>;
  inputEl: Ref<{ focus: () => void } | null>;
}

/**
 * Owns the panel's open/close state, the Cmd+K toggle, and the
 * click-outside auto-collapse. Vuetify menus render in an overlay portal
 * outside the panel DOM, so they're ignored when detecting outside clicks.
 */
export function usePanelVisibility(opts: UsePanelVisibilityOptions) {
  const { rootEl, inputEl, isEnabled } = opts;
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

  onClickOutside(
    rootEl,
    () => {
      if (isOpen.value) close();
    },
    { ignore: ['.v-overlay'] },
  );

  return { isOpen, open, close, toggle };
}
