<template>
  <VChip
    class="px-4"
    close-icon="mdi-close"
    closable
    :prepend-icon="icon"
    :text="name"
    size="small"
    @click:close="emit('close')"
  />
</template>

<script lang="ts" setup>
defineProps<{ name: string; icon: string }>();
const emit = defineEmits(['close']);
</script>
