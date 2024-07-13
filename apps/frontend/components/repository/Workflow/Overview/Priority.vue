<template>
  <VChip :color="color" size="small" rounded>
    <VIcon :icon="icon" size="x-large" start />
    <div class="text-white">{{ label }}</div>
  </VChip>
</template>

<script lang="ts" setup>
defineProps<{ label: string; icon: string; color: string }>();
</script>
