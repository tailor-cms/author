<template>
  <VNavigationDrawer
    :key="store.selectedActivity?.uid"
    class="ml-1"
    color="primary-darken-2"
    elevation="2"
    location="right"
    width="480"
    absolute
    permanent
  >
    <div v-if="store.selectedActivity?.uid">
      <SidebarHeader :activity="store.selectedActivity" />
      <SidebarBody :activity="store.selectedActivity" />
    </div>
    <div v-else class="placeholder mt-16 text-primary-lighten-5">
      <div class="d-flex align-center">
        <VIcon color="primary-lighten-3" size="x-large">
          mdi-arrow-left-circle
        </VIcon>
        <VAlert
          class="info-content ml-2"
          color="primary-lighten-4"
          variant="tonal"
        >
          {{ props.emptyMessage }}
        </VAlert>
      </div>
    </div>
  </VNavigationDrawer>
</template>

<script lang="ts" setup>
import SidebarBody from './SidebarBody.vue';
import SidebarHeader from './SidebarHeader.vue';
import { useCurrentRepository } from '@/stores/current-repository';

const props = withDefaults(defineProps<{ emptyMessage?: string }>(), {
  emptyMessage:
    'Please create your first Item on the left to view and edit its details here.',
});

const store = useCurrentRepository();
</script>

<style lang="scss" scoped>
.v-navigation-drawer {
  text-align: left;

  ::v-deep .v-input {
    $error-color: rgb(var(--v-theme-secondary-lighten-4));

    .v-messages__message,
    .v-field__outline,
    .v-field-label,
    input::placeholder {
      color: rgb(var(--v-theme-primary-lighten-5));
      opacity: 1;
    }

    &.v-input--error {
      .v-messages__message,
      .v-field__outline,
      .v-field-label,
      input::placeholder {
        color: $error-color;
      }
    }
  }
}

.placeholder {
  padding: 0 1rem;

  h4 {
    padding: 0.5rem 0 1.125rem;
    text-align: center;
  }
}
</style>
