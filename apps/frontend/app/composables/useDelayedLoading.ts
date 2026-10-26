import { useTimeoutFn } from '@vueuse/core';

// A fast load shows no loading state
const LOADING_DELAY_MS = 250;

/**
 * Whether to show a loading state (skeleton, spinner, dimming): only once a
 * load has lasted a moment, so quick loads don't flash one.
 */
export const useDelayedLoading = (isLoading: MaybeRefOrGetter<boolean>) => {
  const isVisible = ref(false);
  const { start, stop } = useTimeoutFn(
    () => (isVisible.value = true),
    LOADING_DELAY_MS,
    { immediate: false },
  );

  watch(
    () => toValue(isLoading),
    (loading) => {
      stop();
      isVisible.value = false;
      if (loading) start();
    },
    { immediate: true },
  );

  return isVisible;
};
