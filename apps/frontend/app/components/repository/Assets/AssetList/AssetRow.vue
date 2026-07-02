<template>
  <VListItem
    :ripple="false"
    :class="{ active: isActive }"
    class="asset-row bg-surface-container text-left"
    density="compact"
    lines="two"
    link
    @click="emit('preview', asset)"
  >
    <template #prepend>
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
        <VImg
          v-if="thumbnailUrl"
          :src="thumbnailUrl"
          :aspect-ratio="1"
          class="thumbnail rounded"
          cover
        />
        <VIcon
          v-else
          :color="getAssetColor(asset)"
          :icon="getAssetIcon(asset)"
          class="thumbnail"
          size="24"
        />
        <VIcon
          :color="isSelected ? 'primary' : undefined"
          :icon="isSelected ? 'mdi-checkbox-marked' : 'mdi-checkbox-blank-outline'"
          class="checkbox"
          size="24"
        />
      </div>
    </template>
    <VListItemTitle class="d-flex align-center text-title-small">
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
    </VListItemTitle>
    <VListItemSubtitle class="text-body-medium">
      <template v-if="!compact">
        <span data-testid="assetRow_type" class="text-capitalize">
          {{ getAssetTypeLabel(asset) }}
        </span>
        <VIcon class="mx-1" icon="mdi-circle-small" size="x-small" />
        <template v-if="asset.meta && 'fileSize' in asset.meta">
          {{ formatFileSize(asset.meta.fileSize) }}
          <VIcon class="mx-1" icon="mdi-circle-small" size="x-small" />
        </template>
      </template>
      <span data-percy="hide">{{ formatDate(asset.createdAt) }}</span>
      <template v-if="showFolder">
        <VIcon class="mx-1" icon="mdi-circle-small" size="x-small" />
        <VChip
          :text="folderLabel"
          class="folder-chip"
          data-testid="assetRow_folder"
          prepend-icon="mdi-folder-outline"
          size="x-small"
          variant="tonal"
          rounded="lg"
          @click.stop="emit('open-folder', folderPath)"
        />
      </template>
      <IndexingStatusBadge
        v-if="asset.processingStatus && compact"
        :status="asset.processingStatus"
        size="x-small"
        density="comfortable"
        class="ml-3"
      />
    </VListItemSubtitle>
    <template #append>
      <div class="d-flex align-center">
        <IndexingStatusBadge
          v-if="asset.processingStatus && !compact"
          :status="asset.processingStatus"
          class="mr-3"
        />
        <UserAvatar
          v-if="asset.uploader && !compact"
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
      </div>
    </template>
  </VListItem>
</template>

<script lang="ts" setup>
import { AssetType, type Asset } from '@tailor-cms/interfaces/asset';
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

const props = defineProps<{
  asset: Asset;
  isSelected: boolean;
  isActive: boolean;
  // Show location (only in flat search/filter results).
  showFolder: boolean;
  // Collapse low-priority meta (type + size) when the list is narrow.
  compact?: boolean;
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
.asset-row {
  cursor: pointer;
  border-radius: 8px;
  padding-left: 0.5rem;

  &.active {
    background: rgb(var(--v-theme-surface-container-high));
  }
}

.asset-select {
  position: relative;
  width: 2rem;
  height: 2rem;
  margin: 0.25rem 0 0.25rem 0.25rem;
  cursor: pointer;
  border-radius: 4px;

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

.folder-chip {
  padding-left: 0.625rem;
}

.asset-row:hover,
.asset-select:focus-visible,
.asset-select.selected {
  .checkbox { opacity: 1; }
  .thumbnail { opacity: 0; }
}
</style>
