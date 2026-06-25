<template>
  <VSheet
    class="usages mb-5 pa-4 rounded-lg"
    color="surface-container-low"
    data-testid="assetUsages"
  >
    <div class="meta-label mb-2">Used in</div>
    <VSkeletonLoader
      v-if="isLoading"
      class="pa-0 bg-transparent"
      type="list-item-two-line@2"
    />
    <p v-else-if="!usages.length" class="text-body-small text-medium-emphasis">
      Not used anywhere in this repository.
    </p>
    <VList v-else class="py-0 bg-transparent" density="compact" nav>
      <VListItem
        v-for="(usage, index) in usages"
        :key="index"
        :prepend-icon="iconFor(usage)"
        :subtitle="subtitleFor(usage)"
        :title="titleFor(usage)"
        :to="routeFor(usage)"
        class="px-2"
        data-testid="assetUsage"
        rounded="lg"
      />
    </VList>
  </VSheet>
</template>

<script lang="ts" setup>
import {
  activityHref,
  elementHref,
} from '@/components/common/AgentPanel/entityLinks';
import type { Asset } from '@tailor-cms/interfaces/asset';
import type { AssetUsage } from '@tailor-cms/api-client';
import { startCase } from 'lodash-es';
import assetApi from '@/api/repositoryAsset';

const ICONS: Record<AssetUsage['type'], string> = {
  element: 'mdi-cube-outline',
  activity: 'mdi-file-document-outline',
  repository: 'mdi-cog-outline',
};

const props = defineProps<{ asset: Asset }>();

const isLoading = ref(true);
const usages = ref<AssetUsage[]>([]);

const iconFor = (usage: AssetUsage) => ICONS[usage.type];

const titleFor = (usage: AssetUsage) => {
  if (usage.type === 'repository') return usage.repositoryName || 'Repository';
  return usage.activityName || 'Untitled';
};

const subtitleFor = (usage: AssetUsage) => {
  if (usage.type === 'element') {
    return `${startCase((usage.elementType || '').toLowerCase())} element`;
  }
  return usage.type === 'activity' ? 'Activity' : 'Repository settings';
};

const routeFor = (usage: AssetUsage) => {
  const { repositoryId } = props.asset;
  if (usage.type === 'repository') {
    return `/repository/${repositoryId}/root/settings/general`;
  }
  if (usage.type === 'element') {
    return elementHref(repositoryId, usage.activityId!, usage.elementUid!);
  }
  return activityHref(repositoryId, usage.activityId!);
};

async function fetchUsages(asset: Asset) {
  isLoading.value = true;
  try {
    usages.value = await assetApi.getUsages(asset.repositoryId, asset.id);
  } catch {
    usages.value = [];
  } finally {
    isLoading.value = false;
  }
}

watch(
  () => props.asset.id,
  () => fetchUsages(props.asset),
  { immediate: true },
);
</script>

<style lang="scss" scoped>
.meta-label {
  color: color-mix(in srgb, rgb(var(--v-theme-on-background)) 70%, transparent);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 600;
}
</style>
