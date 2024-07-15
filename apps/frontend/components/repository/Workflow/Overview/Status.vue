<template>
  <VChip size="small" rounded>
    <VIcon :color="color" icon="mdi-circle" size="small" start />
    {{ label }}
  </VChip>
</template>

<script lang="ts" setup>
defineProps<{ label: string; color: string }>();
</script>
