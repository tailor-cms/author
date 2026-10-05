<template>
  <PreviewCard
    :accent="accent"
    :description="description"
    :favicon="favicon"
    :href="linkHref"
    :icon="getAssetIcon(asset)"
    :is-external="isLink"
    :site="site"
    :thumbnail="thumbnailSrc ?? undefined"
    :title="asset.name"
    :variant="isLink ? 'link' : 'file'"
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
import { detectLinkProvider } from '@tailor-cms/common/asset';
import { safeHref } from '@tailor-cms/utils';
import PreviewCard from './PreviewCard.vue';

const props = defineProps<{
  asset: any;
  href?: string;
}>();

const meta = computed(() => props.asset.meta ?? {});
const isLink = computed(() => props.asset.type === AssetType.Link);

const linkHref = computed(() => {
  if (!isLink.value) return props.href;
  return safeHref(meta.value.url ?? '') ?? undefined;
});

const favicon = computed(() => {
  if (!isLink.value) return undefined;
  return safeHref(meta.value.favicon ?? '') ?? undefined;
});

// Drive or SharePoint links are behind a sign-in
// so they are named by their service
const provider = computed(() => {
  if (!isLink.value) return undefined;
  return detectLinkProvider(meta.value.url ?? '').provider ?? undefined;
});

const accent = computed(() =>
  provider.value ? getAssetColor(props.asset) : undefined,
);

const site = computed(() => {
  const label = getAssetLabel(props.asset);
  if (!isLink.value) return label;
  const { domain, siteName } = meta.value;
  if (!provider.value) return siteName || domain || undefined;
  return domain ? `${label} · ${domain}` : label;
});

const description = computed(() =>
  isLink.value ? meta.value.description || undefined : undefined,
);

const { src: thumbnailSrc, onError: onThumbnailError } = useAssetThumbnail(
  () => props.asset,
);
</script>
