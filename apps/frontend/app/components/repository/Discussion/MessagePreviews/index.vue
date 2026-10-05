<template>
  <slot v-if="!isImageOnly" />
  <div v-if="images.length" class="d-flex flex-wrap ga-2 mt-2">
    <ImagePreview
      v-for="{ token, asset, href } in images"
      :key="token.entityId"
      :asset="asset"
      :href="href"
      :is-tile="images.length > 1"
    />
  </div>
  <FilePreview
    v-for="{ token, asset, href } in files"
    :key="token.entityId"
    :asset="asset"
    :href="href"
    class="mt-2"
  />
  <LinkPreview v-for="url in links" :key="url" :url="url" class="mt-2" />
</template>

<script lang="ts" setup>
import type { MessageToken, ReferenceToken } from '@tailor-cms/utils';

import {
  extractReferences,
  extractUrls,
  parseMessage,
  ReferenceType,
} from '@tailor-cms/utils';
import { AssetType } from '@tailor-cms/interfaces/asset';
import { referenceHref } from '@/utils/entityLinks';
import { useCurrentRepository } from '@/stores/current-repository';
import { findAsset } from '../composables/useReferencePreview';
import FilePreview from './FilePreview.vue';
import ImagePreview from './ImagePreview.vue';
import LinkPreview from './LinkPreview.vue';

interface SharedAsset {
  token: ReferenceToken;
  asset: any;
  href?: string;
}

const PREVIEW_LIMIT = 3;

const isImage = ({ asset }: SharedAsset) => asset.type === AssetType.Image;

const props = defineProps<{ content?: string | null }>();

const repoStore = useCurrentRepository();

const shared = computed(() =>
  extractReferences(props.content ?? '')
    .filter((it) => it.entityType === ReferenceType.Asset)
    .slice(0, PREVIEW_LIMIT),
);

// Once loaded; an asset that no longer exists is left out
const assets = ref<SharedAsset[]>([]);

watch(
  shared,
  async (tokens, _, onCleanup) => {
    let isStale = false;
    onCleanup(() => (isStale = true));
    const repositoryId = repoStore.repositoryId as number;
    const found = await Promise.all(
      tokens.map((it) => findAsset(repositoryId, it.entityId)),
    );
    if (isStale) return;
    assets.value = tokens
      .map((token, index) => ({
        token,
        asset: found[index],
        href: referenceHref(repoStore.repositoryId, token),
      }))
      .filter((it) => it.asset);
  },
  { immediate: true },
);

const images = computed(() => assets.value.filter(isImage));
const files = computed(() => assets.value.filter((it) => !isImage(it)));

const links = computed(() => {
  const room = PREVIEW_LIMIT - shared.value.length;
  if (room <= 0) return [];
  return extractUrls(props.content ?? '').slice(0, room);
});

const hasImagePreview = (token: ReferenceToken) =>
  images.value.some((it) => it.token.entityId === token.entityId);

const isImageOrBlank = (token: MessageToken) => {
  if (token.kind === 'reference') return hasImagePreview(token);
  return token.kind === 'text' && !token.text.trim();
};

const isImageOnly = computed(
  () =>
    !!images.value.length &&
    parseMessage(props.content ?? '').every(isImageOrBlank),
);
</script>
