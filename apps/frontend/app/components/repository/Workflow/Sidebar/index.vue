<template>
  <VNavigationDrawer
    :model-value="repositoryStore.isSidebarOpen || mdAndUp"
    :width="lgAndUp ? 480 : 380"
    class="text-left"
    color="surface-container"
    location="right"
    mobile-breakpoint="md"
    absolute
    @update:model-value="repositoryStore.updateSidebar"
  >
    <div v-if="activity?.isTrackedInWorkflow" class="pa-4 pb-16">
      <SidebarHeader :activity="activity" />
      <SidebarBody :activity="activity" class="my-6" />
    </div>
    <VAlert
      v-else
      :text="emptyMessage"
      class="ma-4"
      icon="mdi-arrow-left-circle"
      rounded="lg"
      variant="tonal"
      prominent
    />
    <ActivityDiscussion
      v-if="activity"
      :activity="activity"
      panel
      show-heading
    />
  </VNavigationDrawer>
</template>

<script lang="ts" setup>
import { useDisplay } from 'vuetify';
import SidebarBody from './SidebarBody.vue';
import SidebarHeader from './SidebarHeader.vue';
import ActivityDiscussion from '@/components/repository/Discussion/index.vue';
import { useCurrentRepository } from '@/stores/current-repository';

withDefaults(defineProps<{ emptyMessage?: string }>(), {
  emptyMessage:
    'Please select item on the left to view and edit its status here.',
});

const repositoryStore = useCurrentRepository();
const activity = computed(() => repositoryStore.selectedActivity);
const { mdAndUp, lgAndUp } = useDisplay();
</script>
