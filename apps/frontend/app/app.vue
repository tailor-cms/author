<template>
  <VApp>
    <NuxtPage />
    <NotificationSnackbar />
  </VApp>
</template>

<script lang="ts" setup>
import NotificationSnackbar from '@/components/common/NotificationSnackbar.vue';
</script>

<style lang="scss">
.v-input.required {
  .v-field-label {
    padding-inline-end: 0.5rem;

    &::after {
      position: absolute;
      content: '*';
      color: inherit;
      top: 0;
      // support also RTL direction
      inset-inline-end: 0;
    }
  }
}
</style>
