<template>
  <VChip
    @click:close="emit('close')"
    color="primary-lighten-2"
    variant="tonal"
    closable label
    class="mx-2 mb-1 px-4">
    <VIcon start>{{ props.icon }}</VIcon>
    {{ props.name }}
  </VChip>
</template>

<script lang="ts" setup>
const props = defineProps<{ name: string, icon: string }>();
const emit = defineEmits(['close']);
</script>
