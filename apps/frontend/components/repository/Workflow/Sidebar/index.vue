<template>
  <VNavigationDrawer
    class="px-4"
    color="primary-darken-2"
    elevation="2"
    location="right"
    width="480"
    absolute
    permanent
  >
    <template v-if="isTrackedActivity">
      <SidebarHeader
        v-bind="activity"
        :name="activity?.data.name"
        :updated-at="activity?.status.updatedAt"
        class="pt-4"
      />
      <StatusFieldGroup
        v-bind="activity?.status"
        class="mt-9 mb-2"
        @update:assignee-id="updateStatus('assigneeId', $event)"
        @update:description="updateStatus('description', $event)"
        @update:due-date="updateStatus('dueDate', $event)"
        @update:priority="updateStatus('priority', $event)"
        @update:status="updateStatus('status', $event)"
      />
    </template>
    <div v-else class="d-flex align-center mt-16">
      <VIcon
        color="primary-lighten-3"
        icon="mdi-arrow-left-circle"
        size="x-large"
      />
      <VAlert
        :text="emptyMessage"
        class="ml-2"
        color="primary-lighten-4"
        variant="tonal"
      />
    </div>
    <ActivityDiscussion
      v-if="activity"
      :activity="activity"
      class="mt-2 mb-5 mx-1"
      panel
    />
  </VNavigationDrawer>
</template>

<script lang="ts" setup>
import { computed, defineProps } from 'vue';

import ActivityDiscussion from '@/components/repository/Discussion/index.vue';
import SidebarHeader from './Header.vue';
import StatusFieldGroup from './FieldGroup.vue';
import { useActivityStore } from '@/stores/activity';
import { useCurrentRepository } from '@/stores/current-repository';

withDefaults(defineProps<{ emptyMessage?: string }>(), {
  emptyMessage:
    'Please select item on the left to view and edit its status here.',
});

const notify = useNotification();
const activityStore = useActivityStore();
const repositoryStore = useCurrentRepository();

const activity = computed(() => repositoryStore.selectedActivity);
const isTrackedActivity = computed(() => activity.value?.isTrackedInWorkflow);

const updateStatus = async (key: string, value: any = null) => {
  if (!activity.value) return;
  const status = { ...activity.value.status, [key]: value } as any;
  await activityStore.saveStatus(activity.value.id, status);
  return notify('Status saved', { immediate: true });
};
</script>

<style lang="scss" scoped>
.v-navigation-drawer {
  padding-bottom: 0.375rem;
  text-align: left;
}
</style>
