<template>
  <div class="asset-grid">
    <VCard
      v-for="asset in assets"
      :key="asset.id"
      :disabled="!isCompatible(asset)"
      :color="selectedIds.includes(asset.id) ? 'secondary' : undefined"
      :variant="selectedIds.includes(asset.id) ? 'tonal' : 'flat'"
      class="asset-card bg-surface-container-low pa-2"
      rounded="lg"
      @click="toggle(asset)"
    >
      <VImg
        v-if="asset.publicUrl && asset.type === AssetType.Image"
        :src="asset.publicUrl"
        :aspect-ratio="1"
        class="rounded-lg"
        cover
      />
      <div v-else class="asset-card__icon rounded-lg bg-surface-container">
        <VIcon :icon="getAssetIcon(asset.type)" size="64" />
      </div>
      <div class="d-flex align-center mt-2">
        <div class="flex-grow-1 text-truncate">
          <div class="text-title-small text-truncate">{{ asset.name }}</div>
          <div
            v-if="!isCompatible(asset)"
            class="text-body-small text-medium-emphasis"
          >
            Unsupported format
          </div>
          <div
            v-else-if="'fileSize' in asset.meta"
            class="text-label-medium text-medium-emphasis"
          >
            {{ formatFileSize((asset.meta as FileAssetMeta).fileSize) }}
          </div>
        </div>
        <VIcon
          v-if="selectedIds.includes(asset.id)"
          class="ml-1"
          icon="mdi-check-circle"
        />
      </div>
    </VCard>
  </div>
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

const toggle = (asset: Asset) => {
  if (!isCompatible(asset)) return;
  if (!props.multiple) {
    emit('update:selected', [asset.id]);
    return;
  }
  const next = new Set(props.selectedIds);
  if (next.has(asset.id)) next.delete(asset.id);
  else next.add(asset.id);
  emit('update:selected', [...next]);
};
</script>

<style lang="scss" scoped>
.asset-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 0.75rem;
  max-height: 40vh;
  overflow-y: auto;
}

.asset-card {
  cursor: pointer;
  transition: background 0.15s ease;

  &:hover {
    background-color: rgb(var(--v-theme-surface-container)) !important;
  }
}

.asset-card__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 1;
}
</style>
