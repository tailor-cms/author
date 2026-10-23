<template>
  <FileCard v-if="!isLink" :asset="asset" :href="href" />
  <PreviewCard
    v-else
    :accent="accent"
    :description="meta.description || undefined"
    :favicon="favicon"
    :href="linkHref"
    :icon="getAssetIcon(asset)"
    :site="site"
    :thumbnail="thumbnailSrc ?? undefined"
    :title="asset.name"
    is-external
    @thumbnail:error="onThumbnailError"
  />
</template>

<script lang="ts" setup>
import {
  getAssetColor,
  getAssetIcon,
  getAssetLabel,
} from '@tailor-cms/core-components';
import { AssetType } from '@tailor-cms/interfaces/asset';
import { detectLinkProvider, safeHref } from '@tailor-cms/utils';
import FileCard from '../FileCard.vue';
import PreviewCard from './PreviewCard.vue';

const props = defineProps<{
  asset: any;
  href?: string;
}>();

const meta = computed(() => props.asset.meta ?? {});
const isLink = computed(() => props.asset.type === AssetType.Link);

const linkHref = computed(() => safeHref(meta.value.url ?? '') ?? undefined);
const favicon = computed(
  () => safeHref(meta.value.favicon ?? '') ?? undefined,
);

// Drive or SharePoint links are behind a sign-in
// so they are named by their service
const provider = computed(
  () => detectLinkProvider(meta.value.url ?? '').provider ?? undefined,
);

const accent = computed(() =>
  provider.value ? getAssetColor(props.asset) : undefined,
);

const site = computed(() => {
  const { domain, siteName } = meta.value;
  if (!provider.value) return siteName || domain || undefined;
  const label = getAssetLabel(props.asset);
  return domain ? `${label} · ${domain}` : label;
});

const { src: thumbnailSrc, onError: onThumbnailError } = useAssetThumbnail(
  () => props.asset,
);
</script>
