<template>
  <VNavigationDrawer
    :model-value="repositoryStore.isSidebarOpen || mdAndUp"
    :width="sidebarWidth"
    class="px-4 text-left"
    color="primary-darken-2"
    elevation="2"
    location="right"
    mobile-breakpoint="md"
    absolute
    @update:model-value="repositoryStore.updateSidebar"
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
const { width: pageInnerWidth, mdAndUp } = useDisplay();
const sidebarWidth = computed(() => (pageInnerWidth.value > 2000 ? 680 : 480));
</script>

<style lang="scss" scoped>
:deep(.v-navigation-drawer__content) {
  overflow-y: overlay;
  scrollbar-width: none;
}
</style>
