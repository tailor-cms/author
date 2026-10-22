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
      <VIcon icon="mdi-image-broken-variant" size="84" />
      <span class="mt-3 text-title-medium">
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
        @click="isDialogVisible = true"
      >
        <template #placeholder>
          <div class="d-flex justify-center align-center fill-height">
            <VProgressCircular indeterminate />
          </div>
        </template>
      </VImg>
    </VSheet>
    <EmbedFrame
      v-else-if="embed"
      :embed="embed"
      :poster="linkThumbnail ?? undefined"
      :title="asset.name"
    />
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
      <VIcon :color="assetColor" :icon="assetIcon" size="84" />
      <VBtn
        v-if="previewUrl"
        :href="previewUrl"
        class="mt-4"
        prepend-icon="mdi-open-in-new"
        target="_blank"
        text="Open in new tab"
        variant="tonal"
      />
      <span v-else class="text-title-medium mt-3">
        No preview available
      </span>
    </VSheet>
    <ImageDialog
      v-if="isImage && previewUrl"
      v-model="isDialogVisible"
      :alt="asset.name"
      :height="imageMeta?.height"
      :src="previewUrl"
      :width="imageMeta?.width"
    />
  </div>
</template>

<script lang="ts" setup>
import {
  type Asset,
  type FileAssetMeta,
  type LinkAssetMeta,
  AssetType,
} from '@tailor-cms/interfaces/asset';
import { getLinkEmbed, getLinkThumbnailUrl } from '@tailor-cms/utils';
import { getAssetColor, getAssetIcon } from '../utils';
import EmbedFrame from '@/components/common/EmbedFrame.vue';
import ImageDialog from '@/components/common/ImageDialog.vue';
import api from '@/api/repositoryAsset';

const props = defineProps<{
  asset: Asset;
}>();

const isLoading = ref(false);
const hasError = ref(false);
const previewUrl = ref<string | null>(null);
const isDialogVisible = ref(false);

const assetIcon = computed(() => getAssetIcon(props.asset));
const assetColor = computed(() => getAssetColor(props.asset));
const isImage = computed(() => props.asset?.type === AssetType.Image);
const isLink = computed(() => props.asset?.type === AssetType.Link);

const imageMeta = computed(() =>
  isImage.value ? (props.asset.meta as FileAssetMeta) : null,
);

const linkMeta = computed(() =>
  isLink.value ? (props.asset.meta as LinkAssetMeta) : null,
);

const linkThumbnail = computed(() => getLinkThumbnailUrl(linkMeta.value));

const embed = computed(() =>
  linkMeta.value?.url ? getLinkEmbed(linkMeta.value.url) : null,
);

watch(
  () => props.asset?.id,
  async () => {
    previewUrl.value = null;
    hasError.value = false;
    isDialogVisible.value = false;
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
</style>
