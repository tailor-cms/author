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

const meta = computed(() => (props.asset?.meta ?? {}) as Record<string, any>);
const typeIcon = computed(() => getAssetIcon(props.asset));
const typeColor = computed(() => getAssetColor(props.asset));

const hasChanges = computed(() => {
  if (!props.asset) return false;
  return (
    description.value !== (meta.value.description || '') ||
    JSON.stringify(tags.value) !== JSON.stringify(meta.value.tags || []) ||
    isCoreSource.value !== !!meta.value.isCoreSource
  );
});

function saveMeta() {
  if (!props.asset || !hasChanges.value) return;
  emit('save', props.asset, {
    description: description.value,
    tags: tags.value,
    isCoreSource: isCoreSource.value,
  });
}

const debouncedSave = debounce(saveMeta, 500);

watch(
  () => props.asset?.id,
  (newId, oldId) => {
    if (oldId && oldId !== newId) debouncedSave.flush();
    if (!props.asset) return;
    const m = (props.asset.meta ?? {}) as Record<string, any>;
    description.value = m.description || '';
    tags.value = [...(m.tags || [])];
    isCoreSource.value = !!m.isCoreSource;
  },
  { immediate: true },
);

watch(description, () => debouncedSave());
watch(tags, () => debouncedSave(), { deep: true });
watch(isCoreSource, () => saveMeta());

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
