<template>
  <VRow
    align="center"
    class="asset-row py-3"
    no-gutters
    @click="emit('preview', asset)"
  >
    <VCol class="px-1" cols="auto">
      <VCheckboxBtn
        :model-value="isSelected"
        base-color="primary-lighten-2"
        color="primary-lighten-3"
        density="compact"
        @click.stop="emit('toggle', asset)"
      />
    </VCol>
    <VCol cols="auto" class="px-1">
      <VIcon
        :icon="getAssetIcon(asset)"
        :color="`${getAssetColor(asset)}-lighten-3`"
        size="28"
      />
    </VCol>
    <VCol class="px-2 overflow-hidden text-start">
      <div class="d-flex align-center text-subtitle-2">
        <span data-testid="assetRow_name" class="text-primary-lighten-5 text-truncate">
          {{ getAssetDisplayName(asset) }}
        </span>
        <VIcon
          v-if="(asset.meta as any)?.isCoreSource"
          class="ml-1"
          color="amber-lighten-1"
          icon="mdi-star"
          size="14"
        />
      </div>
      <div class="d-flex align-center text-body-2 text-primary-lighten-3">
        <span
          data-testid="assetRow_type"
          class="text-capitalize">
          {{ getAssetTypeLabel(asset) }}
        </span>
        <VIcon class="mx-1" icon="mdi-circle-small" size="x-small" />
        <template v-if="asset.meta && 'fileSize' in asset.meta">
          {{ formatFileSize(asset.meta.fileSize) }}
          <VIcon class="mx-1" icon="mdi-circle-small" size="x-small" />
        </template>
        <span data-percy="hide">{{ formatDate(asset.createdAt) }}</span>
        <template v-if="asset.processingStatus">
          <VIcon class="mx-1" icon="mdi-circle-small" size="x-small" />
          <IndexingStatusBadge :status="asset.processingStatus" />
        </template>
      </div>
    </VCol>
    <VCol cols="auto" class="d-flex align-center px-1">
      <UserAvatar
        v-if="asset.uploader"
        :img-url="asset.uploader.imgUrl ?? undefined"
        :label="asset.uploader.label"
        class="mr-1"
        size="24"
      />
      <VMenu location="bottom end" @click.stop>
        <template #activator="{ props: menuProps }">
          <VBtn
            v-bind="menuProps"
            aria-label="Actions"
            class="ml-1"
            color="primary-lighten-3"
            icon="mdi-dots-vertical"
            size="small"
            variant="text"
            @click.stop
          />
        </template>
        <VList density="compact">
          <VListItem
            v-if="asset.type !== AssetType.Link"
            prepend-icon="mdi-download-outline"
            title="Download"
            @click="emit('download', asset)"
          />
          <VListItem
            v-if="isIndexable(asset)"
            prepend-icon="mdi-brain"
            title="Index"
            @click="emit('index', asset)"
          />
          <VListItem
            prepend-icon="mdi-delete-outline"
            title="Delete"
            @click="emit('delete', asset)"
          />
        </VList>
      </VMenu>
    </VCol>
  </VRow>
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
  isIndexable,
} from '../utils';
import IndexingStatusBadge from '../IndexingStatusBadge.vue';

defineProps<{
  asset: Asset;
  isSelected: boolean;
}>();

const emit = defineEmits<{
  preview: [asset: Asset];
  toggle: [asset: Asset];
  download: [asset: Asset];
  index: [asset: Asset];
  delete: [asset: Asset];
}>();
</script>

<style lang="scss" scoped>
.asset-row {
  cursor: pointer;
  border-radius: 8px;
  transition: background 0.15s ease;

  &:hover {
    background: rgba(var(--v-theme-primary-lighten-3), 0.08);
  }
}
</style>
