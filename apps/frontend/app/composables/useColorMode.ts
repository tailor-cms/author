import { computed, watch } from 'vue';
import { usePreferredDark, useStorage } from '@vueuse/core';
import { useTheme } from 'vuetify';

const STORAGE_KEY = 'tailor:color-mode';
export type ColorMode = 'light' | 'dark' | 'system';

export const colorMode = useStorage<ColorMode>(STORAGE_KEY, 'dark');

export function resolveTheme(mode: ColorMode, prefersDark: boolean) {
  if (mode === 'system') return prefersDark ? 'dark' : 'light';
  return mode;
}

export const themeOptions: { value: ColorMode; title: string; icon: string }[] =
  [
    { value: 'light', title: 'Light', icon: 'mdi-weather-sunny' },
    { value: 'dark', title: 'Dark', icon: 'mdi-weather-night' },
    { value: 'system', title: 'System', icon: 'mdi-laptop' },
  ];

export function useColorMode() {
  const theme = useTheme();
  const prefersDark = usePreferredDark();

  const mode = computed(() => colorMode.value);
  const isDark = computed(() => theme.global.current.value.dark);

  function set(next: ColorMode) {
    colorMode.value = next;
    theme.change(resolveTheme(next, prefersDark.value));
  }

  // Follow the OS preference while in 'system' mode.
  watch(prefersDark, (dark) => {
    if (colorMode.value === 'system') theme.change(dark ? 'dark' : 'light');
  });

  return { mode, isDark, set };
}
