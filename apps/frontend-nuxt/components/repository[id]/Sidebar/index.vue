<template>
  <VNavigationDrawer
    :key="store.selectedActivity?.uid"
    class="ml-1"
    color="primary-darken-2"
    elevation="2"
    location="right"
    width="450"
    absolute
    permanent
  >
    <div v-if="store.selectedActivity?.uid">
      <SidebarHeader :activity="store.selectedActivity" />
      <SidebarBody :activity="store.selectedActivity" />
    </div>
    <div v-else class="placeholder text-primary-lighten-5">
      <h4 class="text-lime-lighten-3">Outline Sidebar</h4>
      <div class="d-flex align-center">
        <VIcon color="lime-lighten-3">mdi-arrow-left-circle</VIcon>
        <VAlert class="info-content ml-2" variant="tonal">
          {{ props.emptyMessage }}
        </VAlert>
      </div>
    </div>
  </VNavigationDrawer>
</template>

<script lang="ts" setup>
import SidebarBody from './Body.vue';
import SidebarHeader from './Header.vue';
import { useCurrentRepository } from '@/stores/current-repository';

const props = defineProps({
  emptyMessage: {
    type: String,
    default:
      'Please create your first Item on the left to view and edit its details here.',
  },
});

const store = useCurrentRepository();
</script>

<style lang="scss" scoped>
.v-navigation-drawer {
  text-align: left;
}

.placeholder {
  margin-top: 4.375rem;
  padding: 0 1rem;

  h4 {
    padding: 0.5rem 0 1.125rem;
    text-align: center;
    font-size: 1.25rem;
    font-weight: 500;
    letter-spacing: 0.0625rem;
  }

  .v-icon {
    float: left;
    padding: 0.375rem 1.25rem 0 0.75rem;
    color: inherit;
    font-size: 2rem;
  }

  .info-content {
    width: 22rem;
  }
}
</style>
