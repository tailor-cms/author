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
    <VSheet class="thumbnail" color="surface-sunken" rounded="t-lg">
      <VImg
        v-if="thumbnailSrc"
        :src="thumbnailSrc"
        :aspect-ratio="4 / 3"
        cover
        @error="onThumbnailError"
      />
      <VIcon
        v-else
        :color="getAssetColor(asset)"
        :icon="getAssetIcon(asset)"
        size="64"
      />
      <div
        :aria-checked="isSelected"
        :aria-label="`Select ${getAssetDisplayName(asset)}`"
        :class="{ 'selected': isSelected, 'selection-active': isSelectionActive }"
        class="select-overlay elevation-1"
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
    <div class="d-flex align-center pl-3 pr-2 py-2">
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
import type { Asset } from '@tailor-cms/interfaces/asset';

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
  // Any asset selected -> reveal every checkbox (grid multi-select mode).
  isSelectionActive: boolean;
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

const { src: thumbnailSrc, onError: onThumbnailError } = useAssetThumbnail(
  () => props.asset,
);

const folderPath = computed(() => (props.asset.meta as any)?.folder ?? '');
const folderLabel = computed(() => folderPath.value || 'Library');
</script>

<style lang="scss" scoped>
.asset-tile {
  cursor: pointer;
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
  top: 0;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 0;
  height: 1.875rem;
  overflow: hidden;
  border-radius: 6px 0 6px 0;
  background-color: rgba(var(--v-theme-surface-raised), 0.8);
  opacity: 0;
  transition:
    width 0.3s ease-in-out,
    opacity 0.3s ease-in-out;

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
.select-overlay.selected,
.select-overlay.selection-active {
  width: 1.875rem;
  opacity: 1;
}

// Touch devices have no hover: a hidden-yet-tappable checkbox is a silent
// trap, so keep the affordance visible at rest.
@media (hover: none) {
  .select-overlay {
    width: 1.875rem;
    opacity: 1;
  }
}
</style>
