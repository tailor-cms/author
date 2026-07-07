import type { Ref } from 'vue';

const isOffscreen = (el: HTMLElement) => {
  const { top, bottom, left, right } = el.getBoundingClientRect();
  const { innerHeight, innerWidth } = window;
  return top < 0 || bottom > innerHeight || left < 0 || right > innerWidth;
};

/**
 * Scrolls the target element into view while `selected` is truthy -
 * instantly on mount, smoothly on selection change. Centers within the
 * scroll container(s), but only when the element is not already fully
 * visible, so selecting an on-screen item never shifts the viewport.
 */
export function useScrollWhenSelected(
  target: () => HTMLElement | null | undefined,
  selected: Ref<unknown>,
) {
  const scrollIntoView = async (behavior: ScrollBehavior) => {
    await nextTick();
    const el = target();
    if (!el || !isOffscreen(el)) return;
    el.scrollIntoView({ behavior, block: 'center', inline: 'center' });
  };

  onMounted(() => {
    if (selected.value) scrollIntoView('auto');
  });

  watch(selected, (value) => {
    if (value) scrollIntoView('smooth');
  });
}
