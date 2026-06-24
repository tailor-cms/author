<template>
  <VBtnToggle
    v-model="mode"
    class="view-toggle"
    density="comfortable"
    variant="outlined"
    rounded="4"
    divided
    mandatory
  >
    <VBtn
      aria-label="List view"
      icon="mdi-format-list-bulleted"
      size="small"
      value="list"
    />
    <VBtn
      aria-label="Folder view"
      icon="mdi-folder-outline"
      size="small"
      value="folders"
    />
  </VBtnToggle>
</template>

<script lang="ts" setup>
import type { AssetViewMode } from '@/composables/useAssetFolders';

const mode = defineModel<AssetViewMode>({ required: true });
</script>
