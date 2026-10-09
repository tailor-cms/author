import type { MaybeRefOrGetter } from 'vue';
import { omit } from 'lodash-es';
import { useLocalStorage } from '@vueuse/core';

const STORAGE_KEY = 'discussion:drafts';

/**
 * The open thread's unsent text, kept while switching threads and
 * across reloads.
 */
export const useThreadDraft = (
  threadId: MaybeRefOrGetter<number | null | undefined>,
) => {
  const drafts = useLocalStorage<Record<string, string>>(STORAGE_KEY, {});

  const key = computed(() => {
    const id = toValue(threadId);
    return id ? String(id) : '';
  });

  return computed({
    get: () => (key.value && drafts.value[key.value]) || '',
    set: (value: string) => {
      if (!key.value) return;
      const rest = omit(drafts.value, key.value);
      drafts.value = value ? { ...rest, [key.value]: value } : rest;
    },
  });
};
