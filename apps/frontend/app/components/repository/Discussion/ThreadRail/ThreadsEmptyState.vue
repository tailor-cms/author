<template>
  <TailorEmptyState
    :icon="state.icon"
    :text="state.text"
    :title="state.title"
    class="threads-empty-state mt-6 mx-2"
    height="auto"
    size="48"
    text-width="320"
    variant="text"
  />
</template>

<script lang="ts" setup>
import type { ThreadScope } from '@/stores/discussion';

import { oneLine } from 'common-tags';
import { TailorEmptyState } from '@tailor-cms/core-components';

interface EmptyState {
  title: string;
  text: string;
  icon: string;
}

const props = defineProps<{
  scope: ThreadScope;
  filter?: string | null;
}>();

const EMPTY_STATES: Record<ThreadScope, EmptyState> = {
  all: {
    title: 'No threads yet',
    text: `Start one here, or comment on any activity or element.`,
    icon: 'mdi-forum-outline',
  },
  unread: {
    title: 'All caught up',
    text: 'Nothing new since you last looked.',
    icon: 'mdi-check-all',
  },
  mentions: {
    title: 'No mentions',
    text: 'Nobody has needed your attention here yet.',
    icon: 'mdi-at',
  },
  unresolved: {
    title: 'Nothing open',
    text: 'Every thread in this repository is resolved.',
    icon: 'mdi-progress-check',
  },
  mine: {
    title: 'Nothing of yours yet',
    text: 'Threads you post in collect here.',
    icon: 'mdi-account-outline',
  },
};

const state = computed<EmptyState>(() => {
  const filter = props.filter?.trim();
  if (!filter) return EMPTY_STATES[props.scope];
  return {
    title: 'No matches',
    text: oneLine`
      No conversation is called "${filter}". To search what
      was said, use the search bar.`,
    icon: 'mdi-filter-remove-outline',
  };
});
</script>

<style lang="scss" scoped>
.threads-empty-state {
  :deep(.v-empty-state__title) {
    font-size: 1rem;
    line-height: 1.5rem;
  }

  :deep(.v-empty-state__content) {
    padding: 1rem 0 0;
  }

  :deep(.v-empty-state__text) {
    font-size: 0.8125rem;
    line-height: 1.25rem;
    opacity: var(--v-medium-emphasis-opacity);
  }
}
</style>
