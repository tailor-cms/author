<template>
  <VNavigationDrawer
    :class="{ resizing: isResizing }"
    :model-value="!!activity"
    :width="width"
    class="text-left"
    color="surface-sidebar"
    location="right"
    mobile-breakpoint="md"
    absolute
    disable-route-watcher
    @update:model-value="(open) => !open && repositoryStore.deselectActivity()"
  >
    <div
      aria-orientation="vertical"
      class="resize-handle"
      role="separator"
      @pointerdown="startResize"
    />
    <div v-if="activity?.isTrackedInWorkflow" class="pa-5 pb-16">
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
  </VNavigationDrawer>
</template>

<script lang="ts" setup>
import { useDisplay } from 'vuetify';
import SidebarBody from './SidebarBody.vue';
import SidebarHeader from './SidebarHeader.vue';
import { useCurrentRepository } from '@/stores/current-repository';

withDefaults(defineProps<{ emptyMessage?: string }>(), {
  emptyMessage:
    'Please select item on the left to view and edit its status here.',
});

const repositoryStore = useCurrentRepository();
const activity = computed(() => repositoryStore.selectedActivity);
const { lgAndUp } = useDisplay();

const { width, isResizing, startResize } = useDrawerResize({
  side: 'right',
  storageKey: 'repository:workflow-sidebar:width',
  defaultWidth: () => (lgAndUp.value ? 480 : 380),
});
</script>

<style lang="scss" scoped>
// Suppress the drawer's width animation while dragging the handle
.resizing {
  transition-duration: 0s !important;
}

.resize-handle {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 0.3125rem;
  z-index: 100;
  cursor: col-resize;
  touch-action: none;

  &:hover,
  &:active {
    background: rgba(var(--v-theme-primary), 0.25);
  }
}
</style>
