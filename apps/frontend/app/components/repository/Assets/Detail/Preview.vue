<template>
  <div class="preview-area mb-5">
    <VSheet
      v-if="isLoading"
      class="d-flex justify-center align-center rounded-lg"
      color="primary-darken-3"
      height="300"
    >
      <VProgressCircular color="primary-lighten-3" indeterminate />
    </VSheet>
    <VSheet
      v-else-if="hasError"
      class="d-flex flex-column justify-center align-center rounded-lg"
      color="primary-darken-3"
      height="300"
    >
      <VIcon color="red-lighten-3" icon="mdi-image-broken-variant" size="36" />
      <span class="mt-3 text-body-2 text-primary-lighten-2">
        Unable to load preview
      </span>
    </VSheet>
    <VSheet
      v-else-if="isImage && previewUrl"
      class="d-flex justify-center rounded-lg overflow-hidden"
      color="primary-darken-3"
    >
      <VImg
        :src="previewUrl"
        max-height="480"
        max-width="100%"
        @error="hasError = true"
      />
    </VSheet>
    <VSheet
      v-else-if="embedUrl"
      class="rounded-lg overflow-hidden"
      color="primary-darken-3"
    >
      <iframe
        :src="embedUrl"
        class="video-embed"
        allow="autoplay"
        frameborder="0"
        allowfullscreen
      />
    </VSheet>
    <VSheet
      v-else-if="isLink && linkThumbnail"
      class="rounded-lg overflow-hidden"
      color="primary-darken-3"
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
      class="d-flex flex-column justify-center align-center rounded-lg"
      color="primary-darken-3"
      height="160"
    >
      <VIcon :color="`${assetColor}-lighten-3`" :icon="assetIcon" size="48" />
      <VBtn
        v-if="previewUrl"
        :href="previewUrl"
        class="mt-3"
        color="primary-lighten-3"
        prepend-icon="mdi-open-in-new"
        size="small"
        target="_blank"
        variant="tonal"
      >
        Open in new tab
      </VBtn>
      <span v-else class="text-caption text-primary-lighten-2 mt-3">
        No preview available
      </span>
    </VSheet>
  </div>
</template>

<script lang="ts" setup>
import { AssetType, type Asset } from '@tailor-cms/interfaces/asset';

import { getAssetColor, getAssetIcon, toEmbedUrl } from '../utils';
import api from '@/api/repositoryAsset';
import { useCurrentRepository } from '@/stores/current-repository';

const props = defineProps<{ asset: Asset }>();

const currentRepositoryStore = useCurrentRepository();
const repositoryId = computed(() => currentRepositoryStore.repository?.id);

const isLoading = ref(false);
const hasError = ref(false);
const previewUrl = ref<string | null>(null);

const assetIcon = computed(() => getAssetIcon(props.asset));
const assetColor = computed(() => getAssetColor(props.asset));
const isImage = computed(() => props.asset?.type === AssetType.Image);
const isLink = computed(() => props.asset?.type === AssetType.Link);
const embedUrl = computed(() => {
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
    if (!asset?.storageKey || !repositoryId.value) return;
    isLoading.value = true;
    try {
      const { url } = await api.getDownloadUrl(repositoryId.value, asset.id);
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
