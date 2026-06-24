<template>
  <VRow
    class="folder-row px-2 py-3 align-center bg-surface-container"
    data-testid="folderRow"
    density="compact"
    @click="emit('open', folder.path)"
  >
    <VCol cols="auto" class="px-1">
      <VAvatar
        color="surface-container-low"
        class="thumbnail"
        size="40"
        rounded="lg"
      >
        <VIcon icon="mdi-folder" size="24" />
      </VAvatar>
    </VCol>
    <VCol class="px-2 overflow-hidden text-start">
      <div class="d-flex align-center text-title-small">
        <span data-testid="folderRow_name" class="text-truncate">
          {{ folder.name }}
        </span>
      </div>
    </VCol>
    <VCol cols="auto" class="d-flex align-center px-1">
      <VBtn
        v-if="folder.isPending"
        v-tooltip:bottom="'Remove empty folder'"
        aria-label="Remove folder"
        icon="mdi-folder-remove-outline"
        size="small"
        variant="text"
        density="comfortable"
        @click.stop="emit('remove', folder.path)"
      />
    </VCol>
  </VRow>
</template>

<script lang="ts" setup>
import type { FolderNode } from '@/composables/useAssetFolders';

defineProps<{
  folder: FolderNode;
}>();

const emit = defineEmits<{
  open: [path: string];
  remove: [path: string];
}>();
</script>

<style lang="scss" scoped>
.folder-row {
  cursor: pointer;
  border-radius: 8px;
  transition: background 0.15s ease;

  &:hover {
    background-color: rgb(var(--v-theme-surface-container-high));
  }
}
</style>
