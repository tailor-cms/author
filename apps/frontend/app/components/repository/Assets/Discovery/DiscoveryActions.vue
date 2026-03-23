<template>
  <VBtn
    v-if="selectedCount"
    :loading="isAdding"
    :prepend-icon="hasDownloadable ? 'mdi-download' : 'mdi-link-plus'"
    class="mr-4"
    color="primary-lighten-3"
    variant="outlined"
    @click="$emit('add')"
  >
    {{ hasDownloadable ? 'Import' : 'Add as links' }}
    {{ selectedCount }}
  </VBtn>
  <VBtn
    v-if="selectedCount"
    :loading="isAdding"
    class="mr-4"
    color="primary-lighten-3"
    prepend-icon="mdi-brain"
    variant="tonal"
    @click="$emit('add-and-index')"
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
  'add': [];
  'add-and-index': [];
}>();
</script>
