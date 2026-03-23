<template>
  <div v-if="isFetching && !assets.length" class="d-flex justify-center py-16">
    <VProgressCircular color="primary-lighten-3" indeterminate />
  </div>
  <VDataIterator
    v-else-if="assets.length"
    :class="{ 'opacity-50': isFetching }"
    :items="assets"
    :items-length="total"
    :items-per-page="props.itemsPerPage"
    :page="props.page"
  >
    <template #default="{ items }">
      <template v-for="({ raw: asset }, i) in items" :key="asset.id">
        <VRow
          align="center"
          class="asset-row py-3"
          no-gutters
          @click="emit('select', asset)"
        >
          <VCol class="px-1" cols="auto">
            <VCheckboxBtn
              :model-value="selectedIds.has(asset.id)"
              base-color="primary-lighten-2"
              color="primary-lighten-3"
              density="compact"
              @click.stop="emit('select:toggle', asset)"
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
            <div class="d-flex align-center text-subtitle-2 ">
              <span class="text-primary-lighten-5 text-truncate">
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
              <span class="text-capitalize">{{
                getAssetTypeLabel(asset)
              }}</span>
              <VIcon class="mx-1" icon="mdi-circle-small" size="x-small" />
              <template v-if="asset.meta?.fileSize">
                {{ formatFileSize(asset.meta.fileSize) }}
                <VIcon class="mx-1" icon="mdi-circle-small" size="x-small" />
              </template>
              {{ formatDate(asset.createdAt) }}
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
              :label="asset.uploader.fullName || asset.uploader.email"
              class="mr-1"
              size="24"
            />
            <VMenu location="bottom end" @click.stop>
              <template #activator="{ props: menuProps }">
                <VBtn
                  v-bind="menuProps"
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
                  v-if="asset.type !== 'link'"
                  prepend-icon="mdi-download-outline"
                  title="Download"
                  @click="emit('download', asset)"
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
    </template>
    <template #footer>
      <div v-if="pageCount > 1" class="d-flex align-center justify-center pa-4">
        <VPagination
          :model-value="props.page"
          :length="pageCount"
          :total-visible="7"
          active-color="primary-lighten-4"
          color="primary-lighten-3"
          density="comfortable"
          rounded
          @update:model-value="emit('update:page', $event)"
        />
      </div>
    </template>
  </VDataIterator>
  <div
    v-if="!assets.length && !isFetching"
    class="d-flex flex-column align-center py-16"
  >
    <VIcon color="primary-lighten-2" icon="mdi-folder-open-outline" size="64" />
    <div class="mt-4 text-body-1 text-primary-lighten-3">
      {{
        selectedCategory !== 'all'
          ? 'No assets match the selected filter.'
          : 'No assets uploaded yet.'
      }}
    </div>
    <div
      v-if="selectedCategory === 'all'"
      class="text-caption text-primary-lighten-2 mt-1"
    >
      Upload files, add links, or use Discover.
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { Asset } from '@tailor-cms/interfaces/asset';

import {
  formatDate,
  formatFileSize,
  getAssetColor,
  getAssetDisplayName,
  getAssetIcon,
  getAssetTypeLabel,
} from './utils';
import { UserAvatar } from '@tailor-cms/core-components';
import IndexingStatusBadge from './IndexingStatusBadge.vue';

const props = defineProps<{
  isFetching: boolean;
  assets: Asset[];
  total: number;
  page: number;
  itemsPerPage: number;
  selectedIds: Set<number>;
  selectedCategory: string;
}>();

const pageCount = computed(() => Math.ceil(props.total / props.itemsPerPage));

const emit = defineEmits<{
  'update:page': [page: number];
  'select': [asset: Asset];
  'select:toggle': [asset: Asset];
  'download': [asset: Asset];
  'delete': [asset: Asset];
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
