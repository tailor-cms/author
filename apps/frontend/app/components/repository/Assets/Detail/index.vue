<template>
  <VDialog v-model="isOpen" max-width="720" scrollable>
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
          <VBtn icon="mdi-close" class="mr-1 text-primary-lighten-4" @click="emit('close')" />
        </template>
      </VToolbar>
      <VDivider />
      <VCardText class="detail-body pa-5">
        <Preview :asset="asset" />
        <MetaInfo :asset="asset" />
        <div
          class="section-header text-caption text-uppercase text-primary-lighten-2 mb-4"
        >
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
          @click="emit('delete', asset!)"
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
import type { Asset } from '@tailor-cms/interfaces/asset';
import { AssetType, ProcessingStatus } from '@tailor-cms/interfaces/asset';

import { getAssetColor, getAssetDisplayName, getAssetIcon } from '../utils';
import api from '@/api/repositoryAsset';
import MetaInfo from './MetaInfo.vue';
import Preview from './Preview.vue';
import { useCurrentRepository } from '@/stores/current-repository';

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

const isSaving = ref(false);

const isOpen = computed({
  get: () => !!props.asset,
  set: (val) => {
    if (!val) emit('close');
  },
});

const typeIcon = computed(() => getAssetIcon(props.asset!));
const typeColor = computed(() => getAssetColor(props.asset!));
const displayName = computed(() => getAssetDisplayName(props.asset!));

const isLink = computed(() => props.asset?.type === AssetType.Link);
const canDownload = computed(() => !isLink.value && !!props.asset?.storageKey);
const canDeindex = computed(
  () => props.asset?.processingStatus === ProcessingStatus.Completed,
);

const hasChanges = computed(() => {
  if (!props.asset) return false;
  const origDesc = props.asset.meta?.description || '';
  const origTags = props.asset.meta?.tags || [];
  return (
    description.value !== origDesc ||
    JSON.stringify(tags.value) !== JSON.stringify(origTags)
  );
});

watch(
  () => props.asset,
  (asset) => {
    if (!asset) return;
    description.value = asset.meta?.description || '';
    tags.value = asset.meta?.tags || [];
  },
  { immediate: true },
);

async function saveMeta() {
  if (!props.asset || !repositoryId.value) return;
  isSaving.value = true;
  try {
    const meta = {
      description: description.value,
      tags: tags.value,
    };
    await api.updateMeta(repositoryId.value, props.asset.id, meta);
    emit('updated', {
      ...props.asset,
      meta: { ...props.asset.meta, ...meta },
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
