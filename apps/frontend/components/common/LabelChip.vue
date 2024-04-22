<template>
  <VChip
    :color="props.color"
    class="flex-shrink-0 text-caption text-uppercase font-weight-bold readonly"
    label
  >
    <slot></slot>
  </VChip>
</template>

<script lang="ts" setup>
const props = defineProps({
  color: { type: String, default: 'primary-lighten-5' },
});
</script>
