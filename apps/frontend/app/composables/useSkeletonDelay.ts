import { useTimeoutFn } from '@vueuse/core';

// A fast load shows no skeleton
const SKELETON_DELAY_MS = 250;

/**
 * Whether to show a loading skeleton: only once a load has lasted a moment,
 * so quick loads don't flash one.
 */
export const useSkeletonDelay = (isLoading: MaybeRefOrGetter<boolean>) => {
  const isSkeletonVisible = ref(false);
  const { start, stop } = useTimeoutFn(
    () => (isSkeletonVisible.value = true),
    SKELETON_DELAY_MS,
    { immediate: false },
  );

  watch(
    () => toValue(isLoading),
    (loading) => {
      stop();
      isSkeletonVisible.value = false;
      if (loading) start();
    },
    { immediate: true },
  );

  return isSkeletonVisible;
};
