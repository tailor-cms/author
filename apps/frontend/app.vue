<template>
  <VApp>
    <NuxtPage />
  </VApp>
</template>

<script lang="ts" setup>
import { useConfigStore } from '@/stores/config';

useConfigStore().getConfig();
</script>

<style lang="scss">
.v-input.required {
  .v-field-label {
    padding-inline-end: 0.5rem;

    &::after {
      position: absolute;
      content: '*';
      color: rgb(var(--v-theme-primary-darken-5));
      top: 0;
      // support also RTL direction
      inset-inline-end: 0;
    }
  }
}
</style>
