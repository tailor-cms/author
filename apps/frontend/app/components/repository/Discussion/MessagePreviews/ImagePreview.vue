<template>
  <figure :class="{ 'image-preview--tile': isTile }" class="image-preview">
    <figcaption
      v-if="!isTile"
      class="text-body-small text-medium-emphasis text-truncate mb-1"
    >
      {{ asset.name }}<template v-if="size"> · {{ size }}</template>
    </figcaption>
    <div :style="frameStyle" class="image-frame">
      <a :href="href" :title="asset.name" class="d-block h-100">
        <VImg
          v-if="src"
          :alt="asset.name"
          :src="src"
          height="100%"
          cover
          @error="onError"
        />
        <div v-else class="d-flex align-center justify-center h-100">
          <VIcon icon="mdi-image-outline" size="32" />
        </div>
      </a>
      <VBtn
        v-tooltip:top="'Download'"
        aria-label="Download image"
        class="image-download"
        icon="mdi-download"
        rounded="lg"
        size="x-small"
        variant="flat"
        @click="download"
      />
    </div>
  </figure>
</template>

<script lang="ts" setup>
import { formatFileSize } from '@tailor-cms/core-components';
import { repositoryAsset } from '@/api';

const MAX_WIDTH_REM = 22;
const MAX_HEIGHT_REM = 16;
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

const { src, onError } = useAssetThumbnail(() => props.asset);

const size = computed(() => {
  const { fileSize } = props.asset.meta ?? {};
  return fileSize ? formatFileSize(fileSize) : null;
});

const frameStyle = computed(() => {
  if (props.isTile) return undefined;
  const { width, height } = props.asset.meta ?? {};
  const ratio = width && height ? width / height : DEFAULT_RATIO;
  const maxWidth = Math.min(MAX_WIDTH_REM, MAX_HEIGHT_REM * ratio);
  return { aspectRatio: ratio, width: `min(100%, ${maxWidth}rem)` };
});

const download = async () => {
  const { repositoryId, id } = props.asset;
  const result = await repositoryAsset.getDownloadUrl(repositoryId, id);
  if (result?.url) window.open(result.url, '_blank');
};
</script>

<style lang="scss" scoped>
.image-preview {
  max-width: 100%;
  margin: 0;
}

.image-frame {
  position: relative;
  overflow: hidden;
  border: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 0.5rem;
  background: rgba(var(--v-theme-on-surface), 0.04);
}

.image-preview--tile .image-frame {
  width: 8rem;
  aspect-ratio: 1;
}

.image-download {
  position: absolute;
  top: 0.375rem;
  right: 0.375rem;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.image-frame:hover .image-download,
.image-download:focus-visible {
  opacity: 1;
}
</style>
