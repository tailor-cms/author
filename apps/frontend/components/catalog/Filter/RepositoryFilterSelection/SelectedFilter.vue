<template>
  <VChip
    class="mx-2 mb-1 px-5"
    close-icon="mdi-close"
    color="primary-lighten-3"
    variant="tonal"
    closable
    @click:close="emit('close')"
  >
    <VIcon class="mr-3" start>{{ props.icon }}</VIcon>
    {{ props.name }}
  </VChip>
</template>

<script lang="ts" setup>
const props = defineProps<{ name: string; icon: string }>();
const emit = defineEmits(['close']);
</script>
