<template>
  <VDialog v-model="isOpen" :max-width="isImage ? 900 : 720" scrollable>
    <VCard v-if="asset">
      <VToolbar color="surface-container-low">
        <VToolbarTitle class="ml-4 text-body-large font-weight-medium">
          <VIcon
            :color="`${typeColor}-lighten-3`"
            :icon="typeIcon"
            class="mr-1"
          />
          {{ displayName }}
        </VToolbarTitle>
        <template #append>
          <MetaInspector :asset="asset" />
          <VBtn
            aria-label="Close"
            class="mr-1"
            icon="mdi-close"
            @click="emit('close')"
          />
        </template>
      </VToolbar>
      <VDivider />
      <VCardText class="detail-body pa-5">
        <Preview :asset="asset" />
        <MetaInfo :asset="asset" :type-icon="typeIcon" :type-color="typeColor" />
        <EditForm
          v-model:description="description"
          v-model:tags="tags"
          v-model:is-core-source="isCoreSource"
        />
      </VCardText>
      <VDivider />
      <VCardActions class="ga-2 pa-4">
        <VBtn
          :slim="false"
          color="tertiary"
          prepend-icon="mdi-trash-can-outline"
          text="Delete"
          variant="tonal"
          @click="emit('delete', asset)"
        />
        <VSpacer />
        <VBtn
          v-if="canDeindex"
          :slim="false"
          prepend-icon="mdi-text-search-variant"
          text="De-index"
          variant="text"
          @click="emit('deindex', asset)"
        />
        <VBtn
          v-if="canDownload"
          :slim="false"
          prepend-icon="mdi-download"
          text="Download"
          variant="text"
          @click="emit('download', asset)"
        />
        <VBtn
          :disabled="!hasChanges || isSaving"
          :loading="isSaving"
          :slim="false"
          prepend-icon="mdi-content-save"
          text="Save"
          variant="tonal"
          @click="saveMeta"
        />
      </VCardActions>
    </VCard>
  </VDialog>
</template>

<script lang="ts" setup>
import { AssetType, ProcessingStatus } from '@tailor-cms/interfaces/asset';
import type { Asset } from '@tailor-cms/interfaces/asset';

import { getAssetColor, getAssetDisplayName, getAssetIcon } from '../utils';
import EditForm from './EditForm.vue';
import MetaInfo from './MetaInfo.vue';
import MetaInspector from './MetaInspector.vue';
import Preview from './Preview.vue';

const props = defineProps<{
  asset: Asset | null;
  isSaving?: boolean;
}>();

const emit = defineEmits<{
  close: [];
  download: [asset: Asset];
  delete: [asset: Asset];
  deindex: [asset: Asset];
  save: [asset: Asset, meta: Record<string, any>];
}>();

const description = ref('');
const tags = ref<string[]>([]);
const isCoreSource = ref(false);

const isOpen = computed({
  get: () => !!props.asset,
  set: (val) => {
    if (!val) emit('close');
  },
});

const meta = computed(() => (props.asset?.meta ?? {}) as Record<string, any>);
const typeIcon = computed(() => getAssetIcon(props.asset));
const typeColor = computed(() => getAssetColor(props.asset));
const displayName = computed(() => getAssetDisplayName(props.asset));
const isImage = computed(() => props.asset?.type === AssetType.Image);

const canDownload = computed(
  () => props.asset?.type !== AssetType.Link && !!props.asset?.storageKey,
);

const canDeindex = computed(
  () => props.asset?.processingStatus === ProcessingStatus.Completed,
);

const hasChanges = computed(() => {
  if (!props.asset) return false;
  return (
    description.value !== (meta.value.description || '') ||
    JSON.stringify(tags.value) !== JSON.stringify(meta.value.tags || []) ||
    isCoreSource.value !== !!meta.value.isCoreSource
  );
});

// Sync form state when asset changes
watch(
  () => props.asset,
  (asset) => {
    if (!asset) return;
    const m = (asset.meta ?? {}) as Record<string, any>;
    description.value = m.description || '';
    tags.value = [...(m.tags || [])];
    isCoreSource.value = !!m.isCoreSource;
  },
  { immediate: true },
);

function saveMeta() {
  if (!props.asset) return;
  const patch = {
    description: description.value,
    tags: tags.value,
    isCoreSource: isCoreSource.value,
  };
  emit('save', props.asset, patch);
}
</script>

<style lang="scss" scoped>
.detail-body {
  max-height: 70vh;
  overflow-y: auto;
}
</style>
