import { computed } from 'vue';
import { useStorage } from '@vueuse/core';
import { useTheme } from 'vuetify';

const STORAGE_KEY = 'tailor:color-mode';
export type ColorMode = 'light' | 'dark';

export const colorMode = useStorage<ColorMode>(STORAGE_KEY, 'dark');

export function useColorMode() {
  const theme = useTheme();

  const isDark = computed(() => theme.global.current.value.dark);

  function set(next: ColorMode) {
    colorMode.value = next;
    theme.change(next);
  }

  function toggle() {
    set(isDark.value ? 'light' : 'dark');
  }

  return { isDark, toggle };
}
