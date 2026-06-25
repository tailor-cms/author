<template>
  <VListItem
    class="bg-surface-container"
    data-testid="folderRow"
    lines="two"
    rounded="lg"
    @click="emit('open', folder.path)"
  >
    <template #prepend>
      <VIcon
        :icon="folder.isLocal ? 'mdi-folder-outline' : 'mdi-folder'"
        class="text-medium-emphasis"
        size="28"
      />
    </template>
    <VListItemTitle class="text-title-small text-left" data-testid="folderRow_name">
      {{ folder.name }}
    </VListItemTitle>
    <template #append>
      <VMenu :offset="6" location="bottom end">
        <template #activator="{ props: menuProps }">
          <VBtn
            v-bind="menuProps"
            aria-label="Folder actions"
            data-testid="folderMenuBtn"
            density="comfortable"
            icon="mdi-dots-vertical"
            size="small"
            variant="text"
            @click.stop
          />
        </template>
        <VList density="compact" nav>
          <VListItem
            v-if="folder.isLocal"
            data-testid="folderRemoveAction"
            prepend-icon="mdi-trash-can-outline"
            title="Discard folder"
            @click="emit('remove', folder.path)"
          />
          <VListItem
            v-else
            base-color="error"
            data-testid="folderDeleteAction"
            prepend-icon="mdi-trash-can-outline"
            title="Delete folder"
            @click="emit('delete', folder.path)"
          />
        </VList>
      </VMenu>
    </template>
  </VListItem>
</template>

<script lang="ts" setup>
import type { FolderNode } from '@/composables/useAssetFolders';

defineProps<{
  folder: FolderNode;
}>();

const emit = defineEmits<{
  open: [path: string];
  remove: [path: string];
  delete: [path: string];
}>();
</script>
