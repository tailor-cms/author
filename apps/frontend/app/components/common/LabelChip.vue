<template>
  <VChip
    :color="color"
    :text="text"
    class="flex-shrink-0 text-body-small text-uppercase font-weight-bold"
  >
    <template v-if="$slots.default" #default>
      <slot></slot>
    </template>
  </VChip>
</template>

<script lang="ts" setup>
defineProps<{ color?: string; text?: string }>();
</script>
