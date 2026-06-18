<template>
  <VList
    :selected="selectedIds"
    :select-strategy="multiple ? 'leaf' : 'single-leaf'"
    class="asset-list d-flex flex-column py-0 ga-2"
    @update:selected="emit('update:selected', $event)"
  >
    <VListItem
      v-for="asset in assets"
      :key="asset.id"
      :disabled="!isCompatible(asset)"
      :value="asset.id"
      color="secondary"
      class="bg-surface-container-low py-2 px-3"
      rounded="lg"
    >
      <template #prepend>
        <VAvatar rounded="lg" size="40">
          <VImg
            v-if="asset.publicUrl && asset.type === AssetType.Image"
            :src="asset.publicUrl"
            cover
          />
          <VIcon v-else :icon="getAssetIcon(asset.type)" size="22" />
        </VAvatar>
      </template>
      <VListItemTitle class="text-title-small">{{ asset.name }}</VListItemTitle>
      <VListItemSubtitle
        v-if="!isCompatible(asset)"
        class="text-body-small text-medium-emphasis"
      >
        Unsupported format
      </VListItemSubtitle>
      <VListItemSubtitle
        v-else-if="'fileSize' in asset.meta"
        class="text-label-medium"
      >
        {{ formatFileSize((asset.meta as FileAssetMeta).fileSize) }}
      </VListItemSubtitle>
      <template #append>
        <VIcon
          v-if="selectedIds.includes(asset.id)"
          class="mr-2"
          icon="mdi-check-circle"
        />
      </template>
    </VListItem>
  </VList>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

import {
  AssetType,
  type Asset,
  type FileAssetMeta,
} from '@tailor-cms/interfaces/asset.ts';
import { getAssetIcon, formatFileSize } from '#utils';

const props = defineProps<{
  assets: Asset[];
  selectedIds: number[];
  allowedExtensions?: string[];
  multiple?: boolean;
}>();

const emit = defineEmits<{
  'update:selected': [ids: number[]];
}>();

// Normalize extensions to a Set for fast lookup (strip leading dots, lowercase)
const allowedExtensionsSet = computed(() => {
  if (!props.allowedExtensions?.length) return null;
  return new Set(
    props.allowedExtensions.map((e) => e.replace(/^\./, '').toLowerCase()),
  );
});

const isCompatible = (asset: Asset): boolean => {
  if (!allowedExtensionsSet.value) return true;
  const ext = (asset.meta as any)?.extension;
  if (!ext) return true;
  return allowedExtensionsSet.value.has(ext);
};
</script>

<style lang="scss" scoped>
.asset-list {
  max-height: 40vh;
  overflow-y: auto;
  background: transparent;
}

.v-list-item {
  transition: background 0.15s ease;

  &:hover {
    background-color: rgb(var(--v-theme-surface-container));
  }
}
</style>
