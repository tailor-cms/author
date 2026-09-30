<template>
  <VCard
    :disabled="isMissing"
    :ripple="false"
    :to="href"
    class="asset-tile bg-surface-raised text-left"
    elevation="1"
    rounded="lg"
    variant="flat"
    width="8rem"
  >
    <VSheet class="asset-tile-image" color="surface-sunken">
      <VImg
        v-if="thumbnailSrc"
        :aspect-ratio="4 / 3"
        :src="thumbnailSrc"
        cover
        @error="onThumbnailError"
      />
      <VIcon v-else-if="!isLoading" :color="color" :icon="icon" size="40" />
    </VSheet>
    <div class="px-2 py-1">
      <VSkeletonLoader
        :loading="isLoading"
        class="bg-transparent rounded"
        height="1.25rem"
        type="ossein">
        <div :title="name" class="text-title-small text-truncate">
          {{ name }}
        </div>
      </VSkeletonLoader>
      <div
        v-if="$slots.subtitle"
        class="text-body-small text-medium-emphasis text-truncate"
      >
        <slot name="subtitle" />
      </div>
    </div>
  </VCard>
</template>

<script lang="ts" setup>
import type { ReferenceTarget } from './composables/useReferencePreview';

import { getAssetColor, getAssetIcon } from '@tailor-cms/core-components';
import { getAssetDisplayName } from '../Assets/utils';
import { useResolvedReference } from './composables/useReferencePreview';

const props = defineProps<{ reference: ReferenceTarget }>();

const { preview, isLoading, href } = useResolvedReference(
  () => props.reference,
);

const asset = computed(() => preview.value?.asset ?? null);

const isMissing = computed(() => !isLoading.value && !asset.value);

const { src: thumbnailSrc, onError: onThumbnailError } = useAssetThumbnail(
  asset,
);

const name = computed(() => {
  if (isMissing.value) return 'Unavailable';
  return getAssetDisplayName(asset.value) || props.reference.label || '';
});

const icon = computed(() =>
  isMissing.value ? 'mdi-file-hidden' : getAssetIcon(asset.value ?? {}),
);

const color = computed(() => getAssetColor(asset.value ?? {}));
</script>

<style lang="scss" scoped>
.asset-tile-image {
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 4 / 3;
}
</style>
