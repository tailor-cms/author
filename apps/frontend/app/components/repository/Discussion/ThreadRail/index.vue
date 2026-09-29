<template>
  <div class="thread-rail d-flex flex-column h-100">
    <div class="px-4 pt-4 pb-2">
      <RailHeader
        :has-integration-access="hasIntegrationAccess"
        :unread="unread"
        @manage:integrations="emit('manage:integrations')"
        @clear:unread="emit('clear:unread')"
        @start:thread="emit('start:thread')"
      />
      <ThreadFilters v-model:name="name" v-model:scope="scope" />
    </div>
    <VDivider />
    <div class="flex-grow-1 overflow-y-auto pa-2">
      <template v-if="isSkeletonVisible">
        <VSkeletonLoader
          v-for="it in 4"
          :key="it"
          class="mb-2 rounded-lg"
          type="list-item-avatar-two-line"
        />
      </template>
      <VList v-else-if="threads.length" bg-color="transparent" class="pa-0" nav>
        <template v-for="group in groups" :key="group.label">
          <VListSubheader v-if="group.label" class="group-label">
            {{ group.label }}
          </VListSubheader>
          <ThreadRow
            v-for="thread in group.threads"
            :key="thread.id"
            :is-selected="thread.id === selectedId"
            :thread="thread"
            @select="emit('select', $event)"
            @star="(id, isStarred) => emit('star', id, isStarred)"
          />
        </template>
      </VList>
      <ThreadsEmptyState v-else-if="!isLoading" :filter="name" :scope="scope" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { DiscussionThread, ThreadScope } from '@/stores/discussion';

import { partition } from 'lodash-es';
import { useTimeoutFn } from '@vueuse/core';

import RailHeader from './RailHeader.vue';
import ThreadFilters from './ThreadFilters.vue';
import ThreadRow from './ThreadRow.vue';
import ThreadsEmptyState from './ThreadsEmptyState.vue';

interface Props {
  threads: DiscussionThread[];
  unread: { threads: number; mentions: number };
  selectedId?: number | null;
  isLoading?: boolean;
  hasIntegrationAccess?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  selectedId: null,
  isLoading: false,
  hasIntegrationAccess: false,
});

const emit = defineEmits<{
  'select': [threadId: number];
  'star': [threadId: number, isStarred: boolean];
  'start:thread': [];
  'clear:unread': [];
  'manage:integrations': [];
}>();

const scope = defineModel<ThreadScope>('scope', { default: 'all' });
const name = defineModel<string>('name', { default: '' });

// A fast load shows no skeleton
const SKELETON_DELAY_MS = 250;

const isSkeletonVisible = ref(false);
const { start, stop } = useTimeoutFn(
  () => (isSkeletonVisible.value = true),
  SKELETON_DELAY_MS,
  { immediate: false },
);

watch(
  () => props.isLoading,
  (isLoading) => {
    stop();
    isSkeletonVisible.value = false;
    if (isLoading) start();
  },
  { immediate: true },
);

// Starred threads first, followed by the rest
const groups = computed(() => {
  const [starred, rest] = partition(props.threads, 'isStarred');
  if (!starred.length) return [{ label: '', threads: rest }];
  return [
    { label: 'Starred', threads: starred },
    { label: 'More conversations', threads: rest },
  ].filter((it) => it.threads.length);
});
</script>

<style lang="scss" scoped>
.thread-rail {
  min-width: 0;
  background: rgb(var(--v-theme-surface-sidebar));
}

.group-label {
  min-height: 2rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
</style>
