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
        v-bind="selectedActivity"
        :name="selectedActivity?.data.name"
        :updated-at="selectedActivity?.status.updatedAt"
        class="pt-4"
      />
      <StatusFieldGroup
        v-bind="selectedActivity?.status"
        class="mt-9 mb-2"
        @update="updateStatus"
      />
    </template>
    <section v-else class="placeholder grey--text text--darken-3">
      <h4>Status Sidebar</h4>
      <v-icon>mdi-chevron-left</v-icon>
      <div class="info-content">{{ emptyMessage }}</div>
    </section>
    <ActivityDiscussion
      v-if="selectedActivity"
      :activity="selectedActivity"
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

interface Props {
  emptyMessage?: string;
}

withDefaults(defineProps<Props>(), {
  emptyMessage:
    'Please select item on the left to view and edit its status here.',
});

const activityStore = useActivityStore();
const repositoryStore = useCurrentRepository();

const selectedActivity = computed(() => repositoryStore.selectedActivity);
const isTrackedActivity = computed(
  () => selectedActivity.value?.isTrackedInWorkflow,
);

const updateStatus = async (key: string, value: string) => {
  if (!selectedActivity.value) return;
  const status = {
    ...selectedActivity.value?.status,
    [key]: value || null,
  } as any;
  await activityStore.saveStatus(selectedActivity.value.id, status);
};
</script>

<style lang="scss" scoped>
.v-navigation-drawer {
  padding-bottom: 0.375rem;
  text-align: left;
}

.placeholder {
  margin: 4.375rem 0 2.5rem;
  padding: 0 1rem;

  h4 {
    padding: 0.5rem 0 1.125rem;
    font-size: 1.25rem;
    text-align: center;
  }

  .v-icon {
    float: left;
    padding: 0.375rem 1.25rem 0 0.75rem;
    font-size: 2rem;
    color: inherit;
  }

  .info-content {
    width: 22rem;
  }
}
</style>
