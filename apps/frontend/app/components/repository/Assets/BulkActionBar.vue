<template>
  <VSlideYTransition>
    <div
      v-if="selectedIds.size"
      class="d-flex align-center flex-wrap ga-3 mb-4 pa-5 bg-primary-darken-2 rounded">
      <VChip class="mr-1 px-4" color="lime" variant="flat" rounded>
        {{ selectedIds.size }} selected
      </VChip>
      <VBtn
        color="primary-lighten-3"
        size="small"
        variant="outlined"
        @click="$emit('select-all')"
      >
        Select all
      </VBtn>
      <VBtn
        color="primary-lighten-3"
        size="small"
        variant="outlined"
        @click="$emit('clear')"
      >
        Deselect all
      </VBtn>
      <VSpacer />
      <VBtn
        :loading="isIndexing"
        color="primary-lighten-3"
        prepend-icon="mdi-brain"
        size="small"
        variant="outlined"
        @click="$emit('index')"
      >
        Index selected
      </VBtn>
      <VBtn
        :loading="isBulkDeleting"
        color="secondary-lighten-3"
        prepend-icon="mdi-delete"
        size="small"
        variant="outlined"
        @click="$emit('delete')"
      >
        Delete selected
      </VBtn>
      <VBtn
        class="ml-3"
        color="primary-lighten-3"
        size="small"
        variant="text"
        @click="$emit('clear')"
      >
        Cancel
      </VBtn>
    </div>
  </VSlideYTransition>
</template>

<script lang="ts" setup>
defineProps<{
  selectedIds: Set<number>;
  isIndexing: boolean;
  isBulkDeleting: boolean;
}>();

defineEmits(['select-all', 'index', 'delete', 'clear']);
</script>
