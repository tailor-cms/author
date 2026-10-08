<template>
  <PreviewCard
    v-if="isUseful"
    :accent="accent"
    :description="description"
    :favicon="favicon"
    :href="href"
    :icon="icon"
    :site="site"
    :thumbnail="hasInlineMedia ? undefined : thumbnail"
    :title="title"
    is-external
    @thumbnail:error="hasThumbnailFailed = true"
  >
    <template v-if="hasInlineMedia" #media>
      <EmbedFrame
        v-if="embed"
        :embed="embed"
        :poster="thumbnail"
        :title="title"
      />
      <a
        v-else
        :href="href"
        class="d-block"
        rel="noopener noreferrer nofollow"
        target="_blank"
      >
        <VImg
          :alt="title"
          :src="thumbnail"
          rounded="lg"
          @error="hasThumbnailFailed = true"
        />
      </a>
    </template>
  </PreviewCard>
</template>

<script lang="ts" setup>
import type { UrlDescription } from '@tailor-cms/api-client';

import {
  getAssetColor,
  getAssetIcon,
  getAssetLabel,
} from '@tailor-cms/core-components';
import { AssetType } from '@tailor-cms/interfaces/asset';
import { safeHref } from '@tailor-cms/utils';
import { useCurrentRepository } from '@/stores/current-repository';
import { findEmbed } from './embeds';
import { describeUrl } from './urlDescription';
import LinkEmbed from './LinkEmbed.vue';
import PreviewCard from './PreviewCard.vue';

const props = defineProps<{ url: string }>();
const HERO_WIDTH = 400;

const repoStore = useCurrentRepository();

const urlDescription = ref<UrlDescription | null>(null);
const hasThumbnailFailed = ref(false);

watch(
  () => props.url,
  async (url) => {
    const repositoryId = repoStore.repositoryId as number;
    if (!repositoryId) return;
    urlDescription.value = await describeUrl(repositoryId, url);
  },
  { immediate: true },
);

// Shaped like a link asset, so a pasted and an attached Google Sheet get
// the same icon, colour and label
const assetLike = computed(() => ({
  type: AssetType.Link,
  meta: {
    url: props.url,
    provider: urlDescription.value?.provider || undefined,
    contentType: urlDescription.value?.contentType || undefined,
  },
}));

const provider = computed(() => urlDescription.value?.provider ?? '');
const domain = computed(() => urlDescription.value?.domain ?? '');

const icon = computed(() => getAssetIcon(assetLike.value));
const accent = computed(() =>
  provider.value ? getAssetColor(assetLike.value) : undefined,
);

// Without a page title: the service name, or failing that the domain
const title = computed(() => {
  if (urlDescription.value?.title) return urlDescription.value.title;
  return provider.value ? getAssetLabel(assetLike.value) : domain.value;
});

const site = computed(() => {
  const { siteName, title } = urlDescription.value ?? {};
  if (!provider.value) return siteName || domain.value;
  // Without a page title the service name is the title already
  if (!title) return domain.value;
  const label = getAssetLabel(assetLike.value);
  return domain.value ? `${label} · ${domain.value}` : label;
});

const description = computed(
  () => urlDescription.value?.description || undefined,
);
const href = computed(() => safeHref(props.url) ?? undefined);
const favicon = computed(
  () => safeHref(urlDescription.value?.favicon ?? '') ?? undefined,
);

// Known from the URL alone, before the description arrives
const embed = computed(() => findEmbed(props.url));

// The embed's own still first, then the image the page advertised
const thumbnail = computed(() => {
  if (hasThumbnailFailed.value) return undefined;
  const candidate =
    embed.value?.poster || urlDescription.value?.thumbnail || '';
  return safeHref(candidate) ?? undefined;
});

const hasHeroImage = computed(() => {
  if (!thumbnail.value) return false;
  const { thumbnailWidth: width = 0, thumbnailHeight: height = 0 } =
    urlDescription.value ?? {};
  return width >= HERO_WIDTH && height > 0;
});

// A player or a lead image fills the card, never both
const hasInlineMedia = computed(() => !!embed.value || hasHeroImage.value);

// No card when the page gave nothing beyond the link itself
const isUseful = computed(() => {
  if (embed.value) return true;
  if (!urlDescription.value) return false;
  if (provider.value) return true;
  return !!(urlDescription.value.title || description.value || thumbnail.value);
});
</script>
