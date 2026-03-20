<template>
  <VSheet class="pa-4 mb-5 rounded-lg" color="primary-darken-3">
    <div class="meta-grid">
      <div class="meta-item">
        <div class="meta-label">Type</div>
        <div class="d-flex align-center mt-1">
          <VIcon
            :color="`${typeColor}-lighten-3`"
            :icon="typeIcon"
            class="mr-1"
            size="18"
          />
          <span class="meta-value text-capitalize">{{ asset.type }}</span>
        </div>
      </div>
      <div v-if="meta.fileSize" class="meta-item">
        <div class="meta-label">Size</div>
        <div class="meta-value">
          {{ formatFileSize(meta.fileSize) }}
        </div>
      </div>
      <div v-if="meta.extension || meta.mimeType" class="meta-item">
        <div class="meta-label">Format</div>
        <div class="meta-value">
          <span v-if="meta.extension" class="mr-2">.{{ meta.extension }}</span>
          <span v-if="meta.mimeType" class="text-primary-lighten-2">
            {{ meta.mimeType }}
          </span>
        </div>
      </div>
      <div v-if="asset.createdAt" class="meta-item">
        <div class="meta-label">Uploaded</div>
        <div class="meta-value">{{ formatDate(asset.createdAt) }}</div>
      </div>
      <div v-if="asset.uploader" class="meta-item">
        <div class="meta-label">By</div>
        <div class="meta-value d-flex align-center ga-2 mt-1">
          <UserAvatar :img-url="asset.uploader.imgUrl ?? undefined" size="20" />
          {{ asset.uploader.fullName || asset.uploader.email }}
        </div>
      </div>
      <div v-if="asset.processingStatus" class="meta-item">
        <div class="meta-label">Indexing</div>
        <div class="mt-1">
          <IndexingStatusBadge :status="asset.processingStatus" />
        </div>
      </div>
    </div>
    <template v-if="isLink && meta.url">
      <VDivider class="mt-5 mb-4" opacity="0.12" />
      <div class="meta-label">URL</div>
      <a
        :href="meta.url"
        class="meta-value text-primary-lighten-4"
        target="_blank"
      >
        {{ truncatedUrl }}
        <VIcon class="ml-1" icon="mdi-open-in-new" size="x-small" />
      </a>
    </template>
    <template v-if="hasSourceInfo">
      <VDivider class="my-3" opacity="0.12" />
      <div class="meta-label mb-1">Source</div>
      <div class="d-flex align-center ga-2 flex-wrap">
        <a
          v-if="!isLink"
          :href="meta.source.url"
          class="text-body-2 text-primary-lighten-4"
          target="_blank"
        >
          {{ meta.source.title || meta.source.domain }}
          <VIcon class="ml-1" icon="mdi-open-in-new" size="x-small" />
        </a>
        <span
          v-if="meta.source.author"
          class="text-body-2 text-primary-lighten-3"
        >
          by {{ meta.source.author }}
        </span>
        <VChip
          v-if="meta.source.license"
          color="primary-lighten-2"
          size="x-small"
          variant="outlined"
        >
          {{ meta.source.license }}
        </VChip>
      </div>
    </template>
  </VSheet>
</template>

<script lang="ts" setup>
import { AssetType, type Asset } from '@tailor-cms/interfaces/asset';
import { UserAvatar } from '@tailor-cms/core-components';

import {
  formatDate,
  formatFileSize,
  getAssetColor,
  getAssetIcon,
} from '../utils';
import IndexingStatusBadge from '../IndexingStatusBadge.vue';

const props = defineProps<{ asset: Asset }>();

const typeIcon = computed(() => getAssetIcon(props.asset));
const typeColor = computed(() => getAssetColor(props.asset));
const isLink = computed(() => props.asset.type === AssetType.Link);
const meta = computed(() => props.asset.meta as Record<string, any>);

const truncatedUrl = computed(() => {
  const url = meta.value?.url;
  if (!url) return '';
  return url.length > 60 ? `${url.slice(0, 60)}...` : url;
});
</script>

<style lang="scss" scoped>
.meta-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(10rem, 1fr));
  gap: 1rem 1.5rem;
}

.meta-label {
  font-size: 0.7rem;
  color: rgba(var(--v-theme-primary-lighten-2), 0.8);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 600;
}

.meta-value {
  font-size: 0.875rem;
  color: rgb(var(--v-theme-primary-lighten-4));
  margin-top: 0.125rem;
}

a {
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}
</style>
