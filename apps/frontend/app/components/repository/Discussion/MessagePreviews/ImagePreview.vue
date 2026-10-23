<template>
  <figure
    :class="{ 'image-preview--tile': isTile }"
    :style="shape && { width: `min(100%, ${shape.maxWidth}rem)` }"
    class="image-preview"
  >
    <figcaption
      v-if="!isTile"
      class="text-body-small text-medium-emphasis text-truncate mb-1"
    >
      {{ asset.name }}<template v-if="size"> · {{ size }}</template>
    </figcaption>
    <div :style="shape && { aspectRatio: shape.ratio }" class="image-frame">
      <button
        :aria-label="`View ${asset.name}`"
        class="image-button d-block h-100 w-100"
        type="button"
        @click="openDialog"
      >
        <VImg
          v-if="thumbnailSrc"
          :alt="asset.name"
          :src="thumbnailSrc"
          height="100%"
          cover
          @error="onThumbnailError"
        />
        <div v-else class="d-flex align-center justify-center h-100">
          <VIcon icon="mdi-image-outline" size="32" />
        </div>
      </button>
      <div class="image-actions d-flex ga-1">
        <VBtn
          v-if="href"
          v-tooltip:top="'Open in library'"
          :to="href"
          aria-label="Open in library"
          icon="mdi-folder-image"
          rounded="lg"
          size="x-small"
          variant="flat"
        />
        <VBtn
          v-tooltip:top="'Download'"
          aria-label="Download image"
          icon="mdi-download"
          rounded="lg"
          size="x-small"
          variant="flat"
          @click="download"
        />
      </div>
    </div>
    <ImageDialog
      v-model="isDialogVisible"
      :alt="asset.name"
      :height="asset.meta?.height"
      :src="dialogSrc"
      :width="asset.meta?.width"
    />
  </figure>
</template>

<script lang="ts" setup>
import { formatFileSize } from '@tailor-cms/core-components';
import { repositoryAsset } from '@/api';
import ImageDialog from '@/components/common/ImageDialog.vue';

const MAX_WIDTH_REM = 22;
const MAX_HEIGHT_REM = 20;
const DEFAULT_RATIO = 4 / 3;

const props = withDefaults(
  defineProps<{
    asset: any;
    href?: string;
    // One of several images, drawn as a square without a caption
    isTile?: boolean;
  }>(),
  { href: undefined, isTile: false },
);

const { src: thumbnailSrc, onError: onThumbnailError } = useAssetThumbnail(
  () => props.asset,
);

const isDialogVisible = ref(false);
const fileUrl = ref<string | null>(null);

const size = computed(() => {
  const { fileSize } = props.asset.meta ?? {};
  return fileSize ? formatFileSize(fileSize) : null;
});

// The dialog shows the file itself; the thumbnail is used
// as a placeholder until the actual file URL is available
const dialogSrc = computed(() => fileUrl.value ?? thumbnailSrc.value ?? '');

// Natural proportions, capped so one picture never crowds the thread.
const shape = computed(() => {
  if (props.isTile) return null;
  const { width, height } = props.asset.meta ?? {};
  const ratio = width && height ? width / height : DEFAULT_RATIO;
  const maxWidth = Math.min(MAX_WIDTH_REM, MAX_HEIGHT_REM * ratio);
  return { ratio, maxWidth };
});

const fetchFileUrl = async () => {
  if (fileUrl.value) return;
  const { repositoryId, id } = props.asset;
  const result = await repositoryAsset
    .getDownloadUrl(repositoryId, id)
    .catch(() => null);
  fileUrl.value = result?.url ?? null;
};

const openDialog = async () => {
  isDialogVisible.value = true;
  await fetchFileUrl();
};

const download = async () => {
  await fetchFileUrl();
  if (fileUrl.value) window.open(fileUrl.value, '_blank');
};
</script>

<style lang="scss" scoped>
.image-preview {
  max-width: 100%;
  margin: 0;
}

.image-frame {
  position: relative;
  width: 100%;
  overflow: hidden;
  border: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 0.5rem;
  background: rgb(var(--v-theme-surface-base));
}

.image-preview--tile .image-frame {
  width: 8rem;
  aspect-ratio: 1;
}

.image-button {
  padding: 0;
  border: 0;
  background: none;
  cursor: zoom-in;
}

.image-actions {
  position: absolute;
  top: 0.375rem;
  right: 0.375rem;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.image-frame:hover .image-actions,
.image-actions:focus-within {
  opacity: 1;
}
</style>
