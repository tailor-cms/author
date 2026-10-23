<template>
  <div class="thread-list d-flex flex-column h-100">
    <div class="px-4 pt-4 pb-2">
      <ThreadListHeader
        :has-integration-access="hasIntegrationAccess"
        :unread="unread"
        @manage:integrations="emit('manage:integrations')"
        @clear:unread="emit('clear:unread')"
        @collapse="emit('collapse')"
        @start:thread="emit('start:thread')"
      />
      <ThreadFilters v-model:name="name" v-model:scope="scope" />
    </div>
    <div class="flex-grow-1 overflow-y-auto pa-2">
      <!-- Rows shaped like the threads; a refetch keeps the list instead -->
      <template v-if="isSkeletonVisible && !threads.length">
        <VSkeletonLoader
          v-for="it in 12"
          :key="it"
          color="transparent"
          height="36"
          type="list-item"
        />
      </template>
      <VList
        v-else-if="threads.length"
        :class="{ 'opacity-70': isSkeletonVisible }"
        bg-color="transparent"
        class="pa-0"
        nav
      >
        <template v-for="group in groups" :key="group.label">
          <VListSubheader v-if="group.label" class="group-label">
            {{ group.label }}
          </VListSubheader>
          <ThreadListItem
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
import type { ReaderThread } from '@tailor-cms/api-client';
import type { ThreadScope } from '@/stores/messaging';

import { partition } from 'lodash-es';

import ThreadListHeader from './ThreadListHeader.vue';
import ThreadFilters from './ThreadFilters.vue';
import ThreadListItem from './ThreadListItem.vue';
import ThreadsEmptyState from './ThreadsEmptyState.vue';

interface Props {
  threads: ReaderThread[];
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
  'collapse': [];
  'select': [threadId: number];
  'star': [threadId: number, isStarred: boolean];
  'start:thread': [];
  'clear:unread': [];
  'manage:integrations': [];
}>();

const scope = defineModel<ThreadScope>('scope', { default: 'all' });
const name = defineModel<string>('name', { default: '' });

const isSkeletonVisible = useSkeletonDelay(() => props.isLoading);

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
.thread-list {
  min-width: 0;
}

.group-label {
  min-height: 2rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
</style>
