<template>
  <VBtn
    v-if="selectedCount"
    :disabled="isAdding"
    :loading="isAdding"
    :prepend-icon="hasDownloadable ? 'mdi-download' : 'mdi-link-plus'"
    class="mr-4"
    color="primary-lighten-3"
    variant="outlined"
    @click="$emit('add', false)"
  >
    {{ hasDownloadable ? 'Import' : 'Add as links' }}
    {{ selectedCount }}
  </VBtn>
  <VBtn
    v-if="selectedCount"
    :disabled="isAdding"
    :loading="isAdding"
    class="mr-4"
    color="primary-lighten-3"
    prepend-icon="mdi-brain"
    variant="tonal"
    @click="$emit('add', true)"
  >
    {{ hasDownloadable ? 'Import' : 'Add' }} & Index
  </VBtn>
</template>

<script lang="ts" setup>
defineProps<{
  selectedCount: number;
  hasDownloadable: boolean;
  isAdding: boolean;
}>();

defineEmits<{
  'add': [withIndexing: boolean];
}>();
</script>
