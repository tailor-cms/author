<template>
  <VCard
    :data-testid="`assetTile_${asset.id}`"
    :ripple="false"
    :class="{ active: isActive }"
    class="asset-tile bg-surface-raised text-left"
    variant="flat"
    rounded="lg"
    elevation="1"
    @click="emit('preview', asset)"
  >
    <VSheet class="thumbnail" color="surface-container-low" rounded="lg">
      <VImg
        v-if="thumbnailUrl"
        :src="thumbnailUrl"
        :aspect-ratio="4 / 3"
        class="rounded-lg"
        cover
      />
      <VIcon
        v-else
        :color="getAssetColor(asset)"
        :icon="getAssetIcon(asset)"
        size="64"
      />
      <div
        :aria-checked="isSelected"
        :class="{ selected: isSelected }"
        class="select-overlay"
        role="checkbox"
        tabindex="0"
        @click.stop="emit('toggle', asset)"
        @keydown.enter.prevent="emit('toggle', asset)"
        @keydown.space.prevent="emit('toggle', asset)"
      >
        <VIcon
          :color="isSelected ? 'primary' : undefined"
          :icon="isSelected ? 'mdi-checkbox-marked' : 'mdi-checkbox-blank-outline'"
          size="22"
        />
      </div>
    </VSheet>
    <div class="d-flex align-center px-1 pt-2">
      <div class="flex-grow-1 overflow-hidden">
        <div class="d-flex align-center text-title-small">
          <span data-testid="assetTile_name" class="text-truncate">
            {{ getAssetDisplayName(asset) }}
          </span>
          <VIcon
            v-if="(asset.meta as any)?.isCoreSource"
            class="ml-1"
            color="tertiary"
            icon="mdi-star"
            size="14"
          />
        </div>
        <div
          class="d-flex align-center ga-1 text-body-small text-medium-emphasis"
        >
          <IndexingStatusBadge
            v-if="asset.processingStatus"
            :status="asset.processingStatus"
            size="small"
          />
          <span data-percy="hide" class="text-truncate">
            {{ formatDate(asset.createdAt) }}
          </span>
        </div>
      </div>
      <AssetMenu
        :asset="asset"
        @download="emit('download', $event)"
        @index="emit('index', $event)"
        @deindex="emit('deindex', $event)"
        @move="emit('move', $event)"
        @delete="emit('delete', $event)"
      />
    </div>
    <VChip
      v-if="showFolder"
      :text="folderLabel"
      class="folder-chip ma-1 opacity-70"
      data-testid="assetTile_folder"
      prepend-icon="mdi-folder-outline"
      rounded="lg"
      size="x-small"
      @click.stop="emit('open-folder', folderPath)"
    />
  </VCard>
</template>

<script lang="ts" setup>
import { AssetType, type Asset } from '@tailor-cms/interfaces/asset';

import {
  formatDate,
  getAssetColor,
  getAssetDisplayName,
  getAssetIcon,
} from '../utils';
import AssetMenu from '../AssetMenu.vue';
import IndexingStatusBadge from '../IndexingStatusBadge.vue';

const props = defineProps<{
  asset: Asset;
  isSelected: boolean;
  isActive: boolean;
  // Show location (only in flat search/filter results).
  showFolder: boolean;
}>();

const emit = defineEmits<{
  'preview': [asset: Asset];
  'toggle': [asset: Asset];
  'download': [asset: Asset];
  'index': [asset: Asset];
  'deindex': [asset: Asset];
  'move': [asset: Asset];
  'delete': [asset: Asset];
  'open-folder': [path: string];
}>();

const thumbnailUrl = computed(() =>
  props.asset.type === AssetType.Image ? props.asset.publicUrl : null,
);

const folderPath = computed(() => (props.asset.meta as any)?.folder ?? '');
const folderLabel = computed(() => folderPath.value || 'Library');
</script>

<style lang="scss" scoped>
.asset-tile {
  cursor: pointer;
  padding: 0.75rem;
  transition: background-color 0.15s ease;
}

.asset-tile.active {
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background-color: currentColor;
    opacity: calc(var(--v-activated-opacity) * var(--v-theme-overlay-multiplier));
    pointer-events: none;
  }
}

.thumbnail {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 4/3;
}

.select-overlay {
  position: absolute;
  top: 0.25rem;
  left: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 8px;
  background-color: rgb(var(--v-theme-surface) / 0.6);
  opacity: 0;
  transition: opacity 0.15s ease;

  &:focus-visible {
    outline: 2px solid rgb(var(--v-theme-primary));
    outline-offset: 2px;
  }
}

.folder-chip {
  padding-left: 0.625rem;
}

.asset-tile:hover .select-overlay,
.select-overlay:focus-visible,
.select-overlay.selected {
  opacity: 1;
}
</style>
