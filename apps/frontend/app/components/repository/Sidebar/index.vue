<template>
  <VNavigationDrawer
    :key="store.selectedActivity?.uid"
    :model-value="store.isSidebarOpen || mdAndUp"
    :width="sidebarWidth"
    class="repository-sidebar"
    color="surface-container"
    location="right"
    mobile-breakpoint="md"
    absolute
    @update:model-value="store.updateSidebar"
  >
    <div v-if="store.selectedActivity?.uid">
      <SidebarHeader :activity="store.selectedActivity" />
      <SidebarBody :activity="store.selectedActivity" />
    </div>
    <div v-else class="placeholder mt-16">
      <div class="d-flex align-center">
        <VIcon icon="mdi-arrow-left-circle" size="x-large" />
        <VAlert :text="emptyMessage" class="info-content ml-4" variant="tonal" />
      </div>
    </div>
  </VNavigationDrawer>
</template>

<script lang="ts" setup>
import { useDisplay } from 'vuetify';
import SidebarBody from './SidebarBody.vue';
import SidebarHeader from './SidebarHeader.vue';
import { useCurrentRepository } from '@/stores/current-repository';

const props = withDefaults(defineProps<{ emptyMessage?: string }>(), {
  emptyMessage:
    'Please create your first Item on the left to view and edit its details here.',
});

const store = useCurrentRepository();
const { width: pageInnerWidth, mdAndUp } = useDisplay();
const sidebarWidth = computed(() => (pageInnerWidth.value > 2000 ? 680 : 480));
</script>

<style lang="scss" scoped>
.repository-sidebar {
  text-align: left;
}

.placeholder {
  padding: 0 1rem;

  h4 {
    padding: 0.5rem 0 1.125rem;
    text-align: center;
  }
}
</style>
