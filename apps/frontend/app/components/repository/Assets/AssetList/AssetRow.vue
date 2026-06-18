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
        :class="{ 'asset-lead--reveal': isSelected }"
        class="asset-lead"
        role="checkbox"
        tabindex="0"
        @click.stop="emit('toggle', asset)"
        @keydown.enter.prevent="emit('toggle', asset)"
        @keydown.space.prevent="emit('toggle', asset)"
      >
        <VAvatar
          class="asset-lead__avatar"
          color="surface-container-low"
          size="40"
          rounded="lg"
        >
          <VIcon
            :color="getAssetColor(asset)"
            :icon="getAssetIcon(asset)"
            size="24"
          />
        </VAvatar>
        <VCheckboxBtn
          :model-value="isSelected"
          class="asset-lead__check"
          color="primary"
          density="compact"
          tabindex="-1"
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

// Gmail/Contacts swap: the type avatar and the checkbox share one leading
// slot. Avatar at rest; the checkbox takes over on row hover/focus, when
// selected, or once select mode latches — so there's no gap and no shift, and
// the whole slot is the click target (works on touch, where hover is absent).
.asset-lead {
  position: relative;
  width: 40px;
  height: 40px;
  cursor: pointer;
  border-radius: 8px;

  &:focus-visible {
    outline: 2px solid rgb(var(--v-theme-primary));
    outline-offset: 2px;
  }
}

.asset-lead__avatar,
.asset-lead__check {
  position: absolute;
  inset: 0;
  transition: opacity 0.15s ease;
}

.asset-lead__check {
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  pointer-events: none;
}

.asset-row:hover .asset-lead__check,
.asset-lead:focus-visible .asset-lead__check,
.asset-lead--reveal .asset-lead__check {
  opacity: 1;
}

.asset-row:hover .asset-lead__avatar,
.asset-lead:focus-visible .asset-lead__avatar,
.asset-lead--reveal .asset-lead__avatar {
  opacity: 0;
}
</style>
