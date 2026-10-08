<template>
  <slot v-if="!isImageOnly" />
  <div v-if="images.length" class="d-flex flex-wrap ga-2 mt-2">
    <ImagePreview
      v-for="{ reference, asset, href } in images"
      :key="reference.entityId"
      :asset="asset"
      :href="href"
      :is-tile="images.length > 1"
    />
  </div>
  <FilePreview
    v-for="{ reference, asset, href } in files"
    :key="reference.entityId"
    :asset="asset"
    :href="href"
    class="mt-2"
  />
  <LinkPreview v-for="url in links" :key="url" :url="url" class="mt-2" />
</template>

<script lang="ts" setup>
import type { Asset } from '@tailor-cms/interfaces/asset.ts';
import type { MessageToken, ReferenceToken } from '@tailor-cms/utils';

import { extractReferences, extractUrls, parseMessage } from '@tailor-cms/utils';
import { findAsset, getAsset } from '../sharedAssets';
import { AssetType } from '@tailor-cms/interfaces/asset';
import { ReferenceType } from '@tailor-cms/interfaces/comment';
import { referenceHref } from '@/utils/entityLinks';
import { useCurrentRepository } from '@/stores/current-repository';
import FilePreview from './FilePreview.vue';
import ImagePreview from './ImagePreview.vue';
import LinkPreview from './LinkPreview.vue';

interface SharedAsset {
  reference: ReferenceToken;
  asset: Asset;
  href?: string;
}

const PREVIEW_LIMIT = 3;
const isImage = ({ asset }: SharedAsset) => asset.type === AssetType.Image;

const props = defineProps<{ content?: string | null }>();

const repoStore = useCurrentRepository();

const repositoryId = computed(() => repoStore.repositoryId as number);

const shared = computed(() =>
  extractReferences(props.content ?? '')
    .filter((it) => it.entityType === ReferenceType.Asset)
    .slice(0, PREVIEW_LIMIT),
);

// Read from the shared file cache
const assets = computed(() =>
  shared.value.flatMap((reference): SharedAsset[] => {
    const asset = getAsset(repositoryId.value, reference.entityId);
    if (!asset) return [];
    const href = referenceHref(repositoryId.value, reference);
    return [{ reference, asset, href }];
  }),
);
const images = computed(() => assets.value.filter(isImage));
const files = computed(() => assets.value.filter((it) => !isImage(it)));
const links = computed(() => {
  const room = PREVIEW_LIMIT - shared.value.length;
  if (room <= 0) return [];
  return extractUrls(props.content ?? '').slice(0, room);
});

const hasImagePreview = (reference: ReferenceToken) =>
  images.value.some((it) => it.reference.entityId === reference.entityId);

const isImageOrBlank = (token: MessageToken) => {
  if (token.kind === 'reference') return hasImagePreview(token);
  return token.kind === 'text' && !token.text.trim();
};

const isImageOnly = computed(
  () =>
    !!images.value.length &&
    parseMessage(props.content ?? '').every(isImageOrBlank),
);

// Loads each shared file once
watch(
  shared,
  (references) =>
    references.forEach((it) => findAsset(repositoryId.value, it.entityId)),
  { immediate: true },
);
</script>
