<template>
  <div class="d-flex ga-4 mr-4">
    <VBtn
      v-if="selectedCount"
      :disabled="isAdding"
      :loading="isAdding"
      :prepend-icon="hasDownloadable ? 'mdi-download' : 'mdi-link-plus'"
      :text="`${hasDownloadable ? 'Import' : 'Add as links'} (${selectedCount})`"
      variant="outlined"
      @click="$emit('add', false)"
    />
    <VBtn
      v-if="selectedCount"
      :disabled="isAdding"
      :loading="isAdding"
      :text="`${hasDownloadable ? 'Import' : 'Add'} & Index`"
      prepend-icon="mdi-brain"
      variant="tonal"
      @click="$emit('add', true)"
    />
  </div>
</template>

<script lang="ts" setup>
defineProps<{
  selectedCount: number;
  hasDownloadable: boolean;
  isAdding: boolean;
}>();

defineEmits<{
  add: [withIndexing: boolean];
}>();
</script>
