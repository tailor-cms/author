<template>
  <VNavigationDrawer
    :model-value="!!asset"
    :width="sidebarWidth"
    class="asset-sidebar"
    color="surface-container"
    location="right"
    mobile-breakpoint="md"
    absolute
    @update:model-value="onModelValue"
  >
    <template v-if="asset">
      <div class="header d-flex align-center ga-1 px-4 pt-2">
        <VSpacer />
        <MetaInspector :asset="asset" />
        <AssetMenu
          :asset="asset"
          @download="emit('download', $event)"
          @index="emit('index', $event)"
          @deindex="emit('deindex', $event)"
          @delete="emit('delete', $event)"
        />
        <VBtn
          aria-label="Close"
          icon="mdi-close"
          size="small"
          variant="text"
          @click="emit('close')"
        />
      </div>
      <div class="body pa-4">
        <Preview :asset="asset" />
        <MetaInfo
          :asset="asset"
          :type-icon="typeIcon"
          :type-color="typeColor"
        />
        <EditForm
          v-model:description="description"
          v-model:tags="tags"
          v-model:is-core-source="isCoreSource"
        />
      </div>
    </template>
  </VNavigationDrawer>
</template>

<script lang="ts" setup>
import type { Asset } from '@tailor-cms/interfaces/asset';
import { debounce } from 'lodash-es';
import { useDisplay } from 'vuetify';

import { getAssetColor, getAssetIcon } from '../utils';
import AssetMenu from '../AssetMenu.vue';
import EditForm from './EditForm.vue';
import MetaInfo from './MetaInfo.vue';
import MetaInspector from './MetaInspector.vue';
import Preview from './Preview.vue';

const props = defineProps<{
  asset: Asset | null;
}>();

const emit = defineEmits<{
  close: [];
  download: [asset: Asset];
  delete: [asset: Asset];
  index: [asset: Asset];
  deindex: [asset: Asset];
  save: [asset: Asset, meta: Record<string, any>];
}>();

const { lgAndUp } = useDisplay();
const sidebarWidth = computed(() => (lgAndUp.value ? 480 : 380));

const description = ref('');
const tags = ref<string[]>([]);
const isCoreSource = ref(false);

const typeIcon = computed(() => getAssetIcon(props.asset));
const typeColor = computed(() => getAssetColor(props.asset));

function hasChanges(asset: Asset) {
  return (
    description.value !== (asset.meta.description || '') ||
    JSON.stringify(tags.value) !== JSON.stringify(asset.meta.tags || []) ||
    isCoreSource.value !== !!asset.meta.isCoreSource
  );
}

function saveMeta(asset: Asset | null) {
  if (!asset || !hasChanges(asset)) return;
  emit('save', asset, {
    description: description.value,
    tags: tags.value,
    isCoreSource: isCoreSource.value,
  });
}

const debouncedSave = debounce(() => saveMeta(props.asset), 500);

function loadAsset(asset: Asset) {
  description.value = asset.meta.description || '';
  tags.value = [...(asset.meta.tags || [])];
  isCoreSource.value = !!asset.meta.isCoreSource;
}

watch(
  () => props.asset,
  (asset, prevAsset) => {
    if (prevAsset?.id === asset?.id) return;
    debouncedSave.cancel();
    saveMeta(prevAsset ?? null);
    if (asset) loadAsset(asset);
  },
  { immediate: true },
);

watch(description, () => debouncedSave());
watch(tags, () => debouncedSave(), { deep: true });
watch(isCoreSource, () => saveMeta(props.asset));

onBeforeUnmount(() => {
  debouncedSave.flush();
  debouncedSave.cancel();
});

function onModelValue(val: boolean) {
  if (!val) emit('close');
}
</script>

<style lang="scss" scoped>
.asset-sidebar {
  text-align: left;
}

.header {
  min-height: 3rem;
}

.body {
  overflow-y: auto;
}
</style>
