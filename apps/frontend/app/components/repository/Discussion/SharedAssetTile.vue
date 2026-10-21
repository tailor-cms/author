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
import { assetHref } from '@/utils/entityLinks';
import { getAssetDisplayName } from '../Assets/utils';
import { useCurrentRepository } from '@/stores/current-repository';
import { useAssetStore } from '@/stores/assets';

const props = defineProps<{ reference: ReferenceTarget }>();

const repoStore = useCurrentRepository();
const assetStore = useAssetStore();
const repositoryId = computed(() => repoStore.repositoryId as number);
const isLoading = ref(true);

watch(
  () => props.reference.entityId,
  async (id) => {
    isLoading.value = true;
    await assetStore.fetch(repositoryId.value, id);
    isLoading.value = false;
  },
  { immediate: true },
);

const asset = computed(() =>
  assetStore.findById(props.reference.entityId),
);

const href = computed(() =>
  asset.value ? assetHref(asset.value.repositoryId, asset.value.id) : undefined,
);

const { src: thumbnailSrc, onError: onThumbnailError } =
  useAssetThumbnail(asset);

const isMissing = computed(() => !isLoading.value && !asset.value);

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
