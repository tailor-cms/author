<template>
  <VRow
    :class="{ active: isActive }"
    class="asset-row px-2 py-3 align-center bg-surface-container"
    density="compact"
    @click="emit('preview', asset)"
  >
    <VCol cols="auto" class="px-1">
      <div
        :aria-checked="isSelected"
        :class="{ selected: isSelected }"
        class="asset-select"
        role="checkbox"
        tabindex="0"
        @click.stop="emit('toggle', asset)"
        @keydown.enter.prevent="emit('toggle', asset)"
        @keydown.space.prevent="emit('toggle', asset)"
      >
        <VAvatar
          color="surface-container-low"
          class="thumbnail"
          size="40"
          rounded="lg"
        >
          <VIcon
            :color="getAssetColor(asset)"
            :icon="getAssetIcon(asset)"
            size="24"
          />
        </VAvatar>
        <VIcon
          :color="isSelected ? 'primary' : undefined"
          :icon="isSelected ? 'mdi-checkbox-marked' : 'mdi-checkbox-blank-outline'"
          class="checkbox"
          size="24"
        />
      </div>
    </VCol>
    <VCol class="px-2 overflow-hidden text-start">
      <div class="d-flex align-center text-title-small">
        <span data-testid="assetRow_name" class="text-truncate">
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
      <div class="d-flex align-center text-medium-emphasis text-body-medium">
        <span data-testid="assetRow_type" class="text-capitalize">
          {{ getAssetTypeLabel(asset) }}
        </span>
        <VIcon class="mx-1" icon="mdi-circle-small" size="x-small" />
        <template v-if="asset.meta && 'fileSize' in asset.meta">
          {{ formatFileSize(asset.meta.fileSize) }}
          <VIcon class="mx-1" icon="mdi-circle-small" size="x-small" />
        </template>
        <span data-percy="hide">{{ formatDate(asset.createdAt) }}</span>
      </div>
    </VCol>
    <VCol cols="auto" class="d-flex align-center px-1">
      <IndexingStatusBadge
        v-if="asset.processingStatus"
        :status="asset.processingStatus"
        class="mr-3"
      />
      <UserAvatar
        v-if="asset.uploader"
        :img-url="asset.uploader.imgUrl ?? undefined"
        :label="asset.uploader.label"
        class="mr-2"
        size="24"
      />
      <AssetMenu
        :asset="asset"
        @download="emit('download', $event)"
        @index="emit('index', $event)"
        @deindex="emit('deindex', $event)"
        @move="emit('move', $event)"
        @delete="emit('delete', $event)"
      />
    </VCol>
  </VRow>
</template>

<script lang="ts" setup>
import type { Asset } from '@tailor-cms/interfaces/asset';
import { UserAvatar } from '@tailor-cms/core-components';

import {
  formatDate,
  formatFileSize,
  getAssetColor,
  getAssetDisplayName,
  getAssetIcon,
  getAssetTypeLabel,
} from '../utils';
import AssetMenu from '../AssetMenu.vue';
import IndexingStatusBadge from '../IndexingStatusBadge.vue';

defineProps<{
  asset: Asset;
  isSelected: boolean;
  isActive: boolean;
}>();

const emit = defineEmits<{
  preview: [asset: Asset];
  toggle: [asset: Asset];
  download: [asset: Asset];
  index: [asset: Asset];
  deindex: [asset: Asset];
  move: [asset: Asset];
  delete: [asset: Asset];
}>();
</script>

<style lang="scss" scoped>
.asset-row {
  cursor: pointer;
  border-radius: 8px;
  transition: background 0.15s ease;

  &:hover {
    background-color: rgb(var(--v-theme-surface-container-high));
  }

  &.active {
    background: rgb(var(--v-theme-surface-container-high));
  }
}

.asset-select {
  position: relative;
  width: 2.5rem;
  height: 2.5rem;
  cursor: pointer;
  border-radius: 8px;

  &:focus-visible {
    outline: 2px solid rgb(var(--v-theme-primary));
    outline-offset: 2px;
  }

  .thumbnail, .checkbox {
    position: absolute;
    inset: 0;
    margin: auto;
    transition: opacity 0.15s ease;
  }

  .checkbox {
    opacity: 0;
    pointer-events: none;
  }
}

.asset-row:hover,
.asset-select:focus-visible,
.asset-select.selected {
  .checkbox { opacity: 1; }
  .thumbnail { opacity: 0; }
}
</style>
