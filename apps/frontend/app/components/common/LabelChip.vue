<template>
  <VChip
    :color="color"
    class="flex-shrink-0 text-caption text-uppercase font-weight-bold readonly"
    label
  >
    <slot></slot>
  </VChip>
</template>

<script lang="ts" setup>
interface Props {
  color?: string;
}

withDefaults(defineProps<Props>(), { color: 'primary-lighten-5' });
</script>
