<template>
  <VCard
    class="d-flex flex-column align-center justify-center"
    color="primary-darken-1"
    height="250"
    variant="tonal"
  >
    <VIcon :icon="icon" size="500" />
    <VCardTitle class="text-h5 pb-0">{{ name }}</VCardTitle>
    <VCardSubtitle class="text-overline">Work in progress</VCardSubtitle>
  </VCard>
</template>

<script lang="ts" setup>
interface Props {
  icon?: string;
  name?: string;
}

withDefaults(defineProps<Props>(), {
  icon: 'mdi-cube',
  name: 'Content Element',
});
</script>

<style lang="scss" scoped>
.v-card {
  border: 1px dashed color-mix(in srgb, currentColor 36%, transparent);

  .v-icon {
    position: absolute;
    opacity: 0.08;
    left: calc(50% - 15.625rem);
    top: calc(50% - 15.625rem);
    z-index: -1;
    transform: rotate(-15deg);
  }
}
</style>
