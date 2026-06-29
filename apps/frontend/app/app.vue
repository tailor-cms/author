<template>
  <VApp class="bg-surface-container">
    <NuxtPage />
  </VApp>
</template>

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
