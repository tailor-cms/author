<template>
  <VChip size="small" rounded>
    <VIcon :color="color" icon="mdi-circle" size="small" start />
    <span class="text-white">{{ label }}</span>
  </VChip>
</template>

<script lang="ts" setup>
defineProps<{ label: string; color: string }>();
</script>
