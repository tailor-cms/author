<template>
  <VDialog v-model="isOpen" :max-width="isImage ? 900 : 720" scrollable>
    <VCard v-if="asset" color="primary-darken-4">
      <VToolbar color="primary-darken-3" density="comfortable">
        <VToolbarTitle
          class="text-body-1 font-weight-medium text-primary-lighten-4 ml-4"
        >
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
            class="mr-1 text-primary-lighten-4"
            icon="mdi-close"
            @click="emit('close')"
          />
        </template>
      </VToolbar>
      <VDivider />
      <VCardText class="detail-body pa-5">
        <Preview :asset="asset" />
        <MetaInfo :asset="asset" />
        <div class="d-flex align-center justify-space-between mb-4 px-1">
          <div class="d-flex align-center ga-2">
            <VIcon
              :color="isCoreSource ? 'amber-lighten-1' : 'primary-lighten-2'"
              :icon="isCoreSource ? 'mdi-star' : 'mdi-star-outline'"
              size="20"
            />
            <span
              class="text-body-2 text-primary-lighten-3"
              :class="{ 'text-amber-lighten-1 font-weight-medium': isCoreSource }"
            >
              Core Source
            </span>
          </div>
          <VSwitch
            v-model="isCoreSource"
            color="amber-lighten-1"
            density="compact"
            hide-details
            inset
          />
        </div>
        <div
          class="section-header text-caption text-uppercase text-primary-lighten-2 mb-4">
          Edit Details
        </div>
        <VTextarea
          v-model="description"
          color="primary-lighten-3"
          density="comfortable"
          label="Description"
          variant="outlined"
          rows="3"
          hide-details
        />
        <VCombobox
          v-model="tags"
          class="mt-3"
          color="primary-lighten-3"
          density="comfortable"
          label="Tags"
          variant="outlined"
          closable-chips
          chips
          hide-details
          multiple
        />
      </VCardText>
      <VDivider />
      <VCardActions class="pa-4 ga-2">
        <VBtn
          color="secondary-lighten-3"
          prepend-icon="mdi-delete-outline"
          size="small"
          variant="tonal"
          @click="emit('delete', asset)"
        >
          Delete
        </VBtn>
        <VSpacer />
        <VBtn
          v-if="canDeindex"
          color="primary-lighten-3"
          prepend-icon="mdi-text-search-variant"
          size="small"
          variant="text"
          @click="emit('deindex', asset)"
        >
          De-index
        </VBtn>
        <VBtn
          v-if="canDownload"
          color="primary-lighten-3"
          prepend-icon="mdi-download-outline"
          size="small"
          variant="text"
          @click="emit('download', asset)"
        >
          Download
        </VBtn>
        <VBtn
          :disabled="!hasChanges"
          :loading="isSaving"
          color="primary-lighten-3"
          prepend-icon="mdi-content-save-outline"
          size="small"
          variant="tonal"
          @click="saveMeta"
        >
          Save
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

<script lang="ts" setup>
import { AssetType, ProcessingStatus } from '@tailor-cms/interfaces/asset';
import type { Asset } from '@tailor-cms/interfaces/asset';

import api from '@/api/repositoryAsset';
import { useCurrentRepository } from '@/stores/current-repository';
import { getAssetColor, getAssetDisplayName, getAssetIcon } from '../utils';
import MetaInfo from './MetaInfo.vue';
import MetaInspector from './MetaInspector.vue';
import Preview from './Preview.vue';

const props = defineProps<{ asset: Asset | null }>();
const emit = defineEmits<{
  close: [];
  download: [asset: Asset];
  delete: [asset: Asset];
  deindex: [asset: Asset];
  updated: [asset: Asset];
}>();

const currentRepositoryStore = useCurrentRepository();
const repositoryId = computed(() => currentRepositoryStore.repository?.id);

const description = ref('');
const tags = ref<string[]>([]);
const isCoreSource = ref(false);
const isSaving = ref(false);

const isOpen = computed({
  get: () => !!props.asset,
  set: (val) => {
    if (!val) emit('close');
  },
});

const meta = computed(() => (props.asset?.meta ?? {}) as Record<string, any>);
const typeIcon = computed(() => getAssetIcon(props.asset!));
const typeColor = computed(() => getAssetColor(props.asset!));
const displayName = computed(() => getAssetDisplayName(props.asset!));
const isImage = computed(() => props.asset?.type === AssetType.Image);
const canDownload = computed(
  () => props.asset?.type !== AssetType.Link && !!props.asset?.storageKey,
);
const canDeindex = computed(
  () => props.asset?.processingStatus === ProcessingStatus.Completed,
);

// Dirty check against original meta
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
    tags.value = m.tags || [];
    isCoreSource.value = !!m.isCoreSource;
  },
  { immediate: true },
);

async function saveMeta() {
  if (!props.asset || !repositoryId.value) return;
  isSaving.value = true;
  try {
    const patch = {
      description: description.value,
      tags: tags.value,
      isCoreSource: isCoreSource.value,
    };
    await api.updateMeta(repositoryId.value, props.asset.id, patch);
    emit('updated', {
      ...props.asset,
      meta: { ...props.asset.meta, ...patch },
    });
  } finally {
    isSaving.value = false;
  }
}
</script>

<style lang="scss" scoped>
.detail-body {
  max-height: 70vh;
  overflow-y: auto;
}

.section-header {
  letter-spacing: 0.08em;
}
</style>
