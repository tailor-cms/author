<template>
  <div class="preview-area mb-5">
    <VSheet
      v-if="isLoading"
      class="d-flex justify-center align-center"
      color="surface-container-low"
      height="250"
      rounded="lg"
    >
      <VProgressCircular indeterminate />
    </VSheet>
    <VSheet
      v-else-if="hasError"
      class="d-flex flex-column justify-center align-center"
      color="surface-container-low"
      height="250"
      rounded="lg"
    >
      <VAvatar color="error" variant="tonal" size="100">
        <VIcon icon="mdi-image-broken-variant" size="50" />
      </VAvatar>
      <span class="mt-3 text-body-medium">
        Unable to load preview
      </span>
    </VSheet>
    <VSheet
      v-else-if="isImage && previewUrl"
      class="d-flex justify-center overflow-hidden position-relative"
      color="surface-container-low"
      height="250"
      rounded="lg"
    >
      <VImg
        :src="previewUrl"
        class="image-preview"
        height="250"
        max-width="100%"
        @error="hasError = true"
        @click="showZoom = true"
      >
        <template #placeholder>
          <div class="d-flex justify-center align-center fill-height">
            <VProgressCircular indeterminate />
          </div>
        </template>
      </VImg>
    </VSheet>
    <VSheet
      v-else-if="videoEmbedUrl"
      class="overflow-hidden"
      color="surface-container-low"
      rounded="lg"
    >
      <iframe
        :src="videoEmbedUrl"
        class="video-embed"
        allow="autoplay; encrypted-media; picture-in-picture"
        frameborder="0"
        allowfullscreen
      />
    </VSheet>
    <VSheet
      v-else-if="isLink && linkThumbnail"
      class="overflow-hidden"
      color="surface-container-low"
      rounded="lg"
    >
      <VImg
        :src="linkThumbnail"
        height="250"
        @error="hasError = true"
      >
        <template #placeholder>
          <div class="d-flex justify-center align-center fill-height">
            <VProgressCircular indeterminate />
          </div>
        </template>
      </VImg>
    </VSheet>
    <VSheet
      v-else
      class="d-flex flex-column justify-center align-center"
      color="surface-container-low"
      height="250"
      rounded="lg"
    >
      <VAvatar variant="tonal" size="100">
        <VIcon :icon="assetIcon" size="50" />
      </VAvatar>
      <VBtn
        v-if="previewUrl"
        :href="previewUrl"
        class="mt-4"
        prepend-icon="mdi-open-in-new"
        target="_blank"
        text="Open in new tab"
        variant="tonal"
      />
      <span v-else class="text-label-large mt-3">
        No preview available
      </span>
    </VSheet>
    <VOverlay
      v-if="isImage && previewUrl"
      v-model="showZoom"
      :class="{ expanded: showZoom }"
      content-class="d-flex align-center justify-center h-100 w-100"
      close-on-content-click
    >
      <VBtn
        class="position-absolute top-0 right-0 ma-4"
        color="white"
        icon="mdi-close"
        variant="tonal"
        @click="showZoom = false"
      />
      <VImg
        :src="previewUrl ?? ''"
        max-height="80vh"
        max-width="90vw"
        class="rounded-lg"
      />
    </VOverlay>
  </div>
</template>

<script lang="ts" setup>
import { AssetType, type Asset } from '@tailor-cms/interfaces/asset';

import { toEmbedUrl } from '@tailor-cms/common/asset';
import { getAssetColor, getAssetIcon } from '../utils';
import api from '@/api/repositoryAsset';

const props = defineProps<{
  asset: Asset;
}>();

const isLoading = ref(false);
const hasError = ref(false);
const previewUrl = ref<string | null>(null);
const showZoom = ref(false);

const assetIcon = computed(() => getAssetIcon(props.asset));
const assetColor = computed(() => getAssetColor(props.asset));
const isImage = computed(() => props.asset?.type === AssetType.Image);
const isLink = computed(() => props.asset?.type === AssetType.Link);

// Returns embed URL for supported video providers (YouTube, Vimeo, Dailymotion)
// Detection handled by toEmbedUrl in @tailor-cms/common/asset
const videoEmbedUrl = computed(() => {
  if (!isLink.value) return null;
  return toEmbedUrl((props.asset?.meta as any)?.url || '');
});

const linkThumbnail = computed(() =>
  'thumbnail' in (props.asset?.meta || {})
    ? (props.asset.meta as any).thumbnail
    : null,
);

watch(
  () => props.asset?.id,
  async () => {
    previewUrl.value = null;
    hasError.value = false;
    showZoom.value = false;
    if (!props.asset?.storageKey) return;
    isLoading.value = true;
    try {
      const { url } = await api.getDownloadUrl(
        props.asset.repositoryId,
        props.asset.id,
      );
      previewUrl.value = url;
    } catch {
      hasError.value = true;
    } finally {
      isLoading.value = false;
    }
  },
  { immediate: true },
);
</script>

<style scoped>
.preview-area {
  min-height: 7.5rem;
}

.image-preview {
  cursor: zoom-in;
}

.video-embed {
  width: 100%;
  aspect-ratio: 16 / 9;
  display: block;
}

.v-overlay {
  transition: all 0.3s ease;

  &.expanded {
    backdrop-filter: blur(18px);
  }
}
</style>
