<template>
  <VMenu location="bottom end">
    <template #activator="{ props: menuProps }">
      <VBtn
        v-bind="menuProps"
        aria-label="Thread actions"
        density="comfortable"
        icon="mdi-dots-vertical"
        size="small"
        variant="text"
      />
    </template>
    <VList density="compact" min-width="220" nav>
      <VListItem
        v-for="action in actions"
        :key="action.title"
        :base-color="action.color"
        :prepend-icon="action.icon"
        :subtitle="action.subtitle"
        :title="action.title"
        rounded="lg"
        @click="action.run"
      />
    </VList>
  </VMenu>
</template>

<script lang="ts" setup>
import type { DiscussionThread } from '@/stores/discussion';

import { isChannelThread } from '../composables/useThreadAnchor';

interface ThreadAction {
  title: string;
  icon: string;
  subtitle?: string;
  color?: string;
  run: () => void;
}

const props = defineProps<{ thread: DiscussionThread }>();

const emit = defineEmits<{
  'star': [isStarred: boolean];
  'resolve': [isResolved: boolean];
  'remove:thread': [];
  'open:files': [];
  'open:subscriptions': [];
}>();

const starAction = (isStarred?: boolean): ThreadAction =>
  isStarred
    ? {
        title: 'Remove star',
        icon: 'mdi-star-off-outline',
        run: () => emit('star', false),
      }
    : {
        title: 'Star',
        icon: 'mdi-star-outline',
        subtitle: 'Keeps it at the top of your rail',
        run: () => emit('star', true),
      };

const resolveAction = (isResolved?: boolean): ThreadAction =>
  isResolved
    ? {
        title: 'Reopen',
        icon: 'mdi-lock-open-variant-outline',
        run: () => emit('resolve', false),
      }
    : {
        title: 'Resolve',
        icon: 'mdi-check-circle-outline',
        subtitle: 'Keeps it on the record',
        run: () => emit('resolve', true),
      };

const subscribeAction = (count: number): ThreadAction => ({
  title: 'Subscribe to updates',
  icon: 'mdi-bell-outline',
  subtitle: count ? `${count} subscribed` : 'Nothing reported here',
  run: () => emit('open:subscriptions'),
});

const filesAction: ThreadAction = {
  title: 'Shared files',
  icon: 'mdi-folder-multiple-outline',
  subtitle: 'Files and links posted here',
  run: () => emit('open:files'),
};

const removeAction: ThreadAction = {
  title: 'Delete thread',
  icon: 'mdi-trash-can-outline',
  color: 'error',
  run: () => emit('remove:thread'),
};

// A comment thread is resolved, not deleted. A channel thread can be
// deleted, and can be subscribed to updates
const actions = computed<ThreadAction[]>(() => {
  const { isStarred, isResolved, subscriptions = [] } = props.thread;
  if (!isChannelThread(props.thread)) {
    return [starAction(isStarred), resolveAction(isResolved), filesAction];
  }
  return [
    starAction(isStarred),
    filesAction,
    subscribeAction(subscriptions.length),
    removeAction,
  ];
});
</script>
