<template>
  <VNavigationDrawer
    :key="store.selectedActivity?.uid"
    :model-value="store.isSidebarOpen || mdAndUp"
    :width="lgAndUp ? 480 : 380"
    class="text-left"
    color="surface-container"
    location="right"
    mobile-breakpoint="md"
    absolute
    @update:model-value="store.updateSidebar"
  >
    <div v-if="store.selectedActivity?.uid" class="pa-4 pb-16">
      <SidebarHeader :activity="store.selectedActivity" />
      <SidebarBody :activity="store.selectedActivity" class="my-6" />
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
    'Please create your first Item on the left to view and edit its details here.',
});

const store = useCurrentRepository();
const { mdAndUp, lgAndUp } = useDisplay();
</script>
