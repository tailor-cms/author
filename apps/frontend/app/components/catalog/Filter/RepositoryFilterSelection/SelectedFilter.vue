<template>
  <VChip
    class="px-4"
    close-icon="mdi-close"
    color="primary-lighten-3"
    closable
    :prepend-icon="props.icon"
    :text="props.name"
    @click:close="emit('close')"
  />
</template>

<script lang="ts" setup>
const props = defineProps<{ name: string; icon: string }>();
const emit = defineEmits(['close']);
</script>
