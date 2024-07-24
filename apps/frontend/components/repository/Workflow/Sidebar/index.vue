<template>
  <VNavigationDrawer
    class="px-4 text-left"
    color="primary-darken-2"
    elevation="2"
    location="right"
    width="480"
    absolute
    permanent
  >
    <template v-if="activity?.isTrackedInWorkflow">
      <SidebarHeader :activity="activity" class="pt-4" />
      <SidebarBody :activity="activity" class="mt-9 mb-2" />
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
      show-heading
    />
  </VNavigationDrawer>
</template>

<script lang="ts" setup>
import ActivityDiscussion from '@/components/repository/Discussion/index.vue';
import SidebarBody from './SidebarBody.vue';
import SidebarHeader from './SidebarHeader.vue';
import { useCurrentRepository } from '@/stores/current-repository';

withDefaults(defineProps<{ emptyMessage?: string }>(), {
  emptyMessage:
    'Please select item on the left to view and edit its status here.',
});

const repositoryStore = useCurrentRepository();
const activity = computed(() => repositoryStore.selectedActivity);
</script>
