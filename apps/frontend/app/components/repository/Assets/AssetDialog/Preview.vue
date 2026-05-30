<template>
  <div class="preview-area mb-5">
    <VSheet
      v-if="isLoading"
      class="d-flex justify-center align-center"
      color="surface-container-low"
      height="300"
      rounded="lg"
    >
      <VProgressCircular indeterminate />
    </VSheet>
    <VSheet
      v-else-if="hasError"
      class="d-flex flex-column justify-center align-center"
      color="surface-container-low"
      height="300"
      rounded="lg"
    >
      <VIcon color="error" icon="mdi-image-broken-variant" size="36" />
      <span class="mt-3 text-body-medium">
        Unable to load preview
      </span>
    </VSheet>
    <VSheet
      v-else-if="isImage && previewUrl"
      class="d-flex justify-center overflow-hidden"
      color="surface-container-low"
      max-height="480"
    >
      <VImg
        :src="previewUrl"
        max-height="480"
        max-width="100%"
        @error="hasError = true"
      />
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
        max-height="300"
        cover
        @error="hasError = true"
      />
    </VSheet>
    <VSheet
      v-else
      class="d-flex flex-column justify-center align-center"
      color="surface-container-low"
      height="160"
      rounded="lg"
    >
      <VIcon :color="`${assetColor}-lighten-3`" :icon="assetIcon" size="48" />
      <VBtn
        v-if="previewUrl"
        :href="previewUrl"
        class="mt-4"
        prepend-icon="mdi-open-in-new"
        target="_blank"
        text="Open in new tab"
        variant="tonal"
      />
      <span v-else class="text-body-large mt-3">
        No preview available
      </span>
    </VSheet>
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
  () => props.asset,
  async (asset) => {
    previewUrl.value = null;
    hasError.value = false;
    if (!asset?.storageKey) return;
    isLoading.value = true;
    try {
      const { url } = await api.getDownloadUrl(asset.repositoryId, asset.id);
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

.video-embed {
  width: 100%;
  aspect-ratio: 16 / 9;
  display: block;
}
</style>
