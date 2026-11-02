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
        v-model:opened="openSections"
        :class="{ 'opacity-70': isSkeletonVisible }"
        bg-color="transparent"
        class="pa-0"
        indent="0"
        nav
      >
        <VListGroup
          v-for="group in groups"
          :key="group.id"
          :value="group.id"
          class="thread-section"
        >
          <template #activator="{ props: activator, isOpen }">
            <ThreadSectionHeader
              v-bind="activator"
              :is-open="isOpen"
              :label="group.label"
              :unread-count="group.unreadCount"
            />
          </template>
          <ThreadListItem
            v-for="thread in group.threads"
            :key="thread.id"
            :is-selected="thread.id === selectedId"
            :thread="thread"
            @select="emit('select', $event)"
            @star="(id, isStarred) => emit('star', id, isStarred)"
          />
        </VListGroup>
      </VList>
      <ThreadsEmptyState
        v-else-if="!isLoading"
        :filter="name"
        :scope="scope"
        @clear:search="name = ''"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { ReaderThread } from '@tailor-cms/api-client';
import type { ThreadScope } from '@/stores/messaging';

import { map, negate, partition, sumBy } from 'lodash-es';
import { ThreadType } from '@tailor-cms/interfaces/comment';

import ThreadListHeader from './ThreadListHeader.vue';
import ThreadFilters from './ThreadFilters.vue';
import ThreadListItem from './ThreadListItem.vue';
import ThreadSectionHeader from './ThreadSectionHeader.vue';
import ThreadsEmptyState from './ThreadsEmptyState.vue';

const isTopic = (it: ReaderThread) => it.type === ThreadType.Repository;

const SECTIONS = [
  { id: 'topics', label: 'Topics', includes: isTopic },
  { id: 'content', label: 'Content', includes: negate(isTopic) },
];

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

const isSkeletonVisible = useDelayedLoading(() => props.isLoading);

const starredFirst = (threads: ReaderThread[]) =>
  partition(threads, 'isStarred').flat();

const groups = computed(() =>
  SECTIONS.map(({ id, label, includes }) => {
    const threads = starredFirst(props.threads.filter(includes));
    return { id, label, threads, unreadCount: sumBy(threads, 'unreadCount') };
  }).filter((it) => it.threads.length),
);

const openSections = ref(map(SECTIONS, 'id'));

// A filter never leaves matches hidden in a collapsed section
watch([name, scope], () => (openSections.value = map(SECTIONS, 'id')));
</script>

<style lang="scss" scoped>
.thread-list {
  min-width: 0;
}
</style>
