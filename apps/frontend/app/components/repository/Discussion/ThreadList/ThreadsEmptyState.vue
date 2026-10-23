<template>
  <TailorEmptyState
    v-if="filter?.trim()"
    :text="noMatchesText"
    action-text="Clear search"
    class="mt-6"
    height="auto"
    icon="mdi-magnify"
    prepend-action-icon="mdi-close"
    title="No matches"
    variant="text"
    @click:action="emit('clear:search')"
  />
  <TailorEmptyState
    v-else
    v-bind="EMPTY_STATES[scope]"
    class="mt-6"
    height="auto"
    variant="text"
  />
</template>

<script lang="ts" setup>
import type { ThreadScope } from '@/stores/messaging';

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

const emit = defineEmits<{ 'clear:search': [] }>();

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

const noMatchesText = computed(() => oneLine`
  No conversation is called "${props.filter?.trim()}". To search what
  was said, use the search bar.`);
</script>
