<template>
  <template v-if="useFieldInput">
    <VTextField
      v-if="!resolvedFileKey"
      :density="density"
      :label="resolvedLabel"
      :placeholder="placeholder || 'Click to add...'"
      :prepend-inner-icon="resolvedIcon"
      :variant="variant"
      append-inner-icon="mdi-upload"
      model-value=""
      readonly
      @click="dialogOpen = true"
    />
    <FilePreview
      v-else
      :dark="dark"
      :file-name="resolvedFileName"
      :icon="resolvedIcon"
      :label="resolvedLabel"
      :is-loading="isLoadingPublicUrl"
      :show-preview="isPreviewEnabled"
      :url="previewUrl"
      @delete="onClear"
      @download="downloadFile(resolvedFileKey, resolvedFileName)"
    />
  </template>
  <template v-else>
    <VBtn
      v-if="!resolvedFileKey"
      :loading="uploading"
      :prepend-icon="resolvedIcon"
      color="primary-darken-2"
      variant="tonal"
      @click="dialogOpen = true"
    >
      {{ placeholder || emptyLabel }}
    </VBtn>
    <VBtn
      v-else
      :prepend-icon="resolvedIcon"
      color="primary-darken-2"
      variant="tonal"
      @click="dialogOpen = true"
    >
      <span class="file-name text-truncate">
        {{ resolvedFileName }}
      </span>
      <template #append>
        <VIcon
          class="ml-2 pa-2"
          icon="mdi-trash-can-outline"
          size="large"
          @click.stop="onClear"
        />
      </template>
    </VBtn>
  </template>
  <PickerDialog
    v-model="dialogOpen"
    :accept="acceptedFileTypes"
    :allow-url-source="allowUrlSource"
    :allowed-extensions="allowedExtensions"
    :heading="dialogHeading"
    :icon="resolvedIcon"
    @select="onSelect"
    @upload="onUploadFile"
  />
</template>

<script lang="ts" setup>
import { computed, inject, ref, watch } from 'vue';
import { AssetType, inferAssetType } from '@tailor-cms/interfaces/asset';
import FilePreview from './FilePreview.vue';
import PickerDialog from './PickerDialog/index.vue';
import { useUpload } from '../../composables/useUpload';

import { ASSET_TYPE_ICON, ASSET_TYPE_LABEL } from '#config';
import type { VTextField } from 'vuetify/components';

defineOptions({ inheritAttrs: false });

interface Props {
  // Storage key or storage:// URI of the current file
  fileKey?: string;
  // Display name; falls back to parsing from fileKey
  fileName?: string;
  // Allow importing assets from an external URL
  allowUrlSource?: boolean;
  // Accepted extensions with dot prefix (e.g. ['.jpg', '.png']);
  // also drives icon/label auto-detection and library tab filtering
  allowedExtensions?: string[];
  // Use field input + card rendering instead of default button mode
  useFieldInput?: boolean;
  // Enable image thumbnail + overlay on the file card;
  // auto-enabled when extensions resolve to an image type
  showPreview?: boolean;
  // Pre-resolved public URL; skips async fetch when present
  publicUrl?: string | null;
  label?: string;
  placeholder?: string;
  // Override the auto-inferred icon (derived from extensions)
  icon?: string;
  // Vuetify props passed to VTextField (empty state in field input mode)
  variant?: VTextField['variant'];
  density?: VTextField['density'];
  // Dark theme variant for the file preview card
  dark?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  allowedExtensions: () => [],
  useFieldInput: false,
  allowUrlSource: false,
  publicUrl: null,
  showPreview: false,
  variant: 'outlined',
  density: 'default',
  dark: false,
});

const emit = defineEmits<{
  upload: [value: Record<string, any>];
  input: [value: Record<string, any> | null];
  delete: [];
}>();

const storageService = inject<any>('$storageService');
const { upload, downloadFile, uploading } = useUpload(emit as any);

const dialogOpen = ref(false);

const dialogHeading = computed(() => {
  const base = props.placeholder || resolvedLabel.value;
  return resolvedFileKey.value ? `Change ${base.toLowerCase()}` : base;
});

const acceptedFileTypes = computed(() =>
  props.allowedExtensions.join(','),
);

// Normalize storage:// URI to bare key
const resolvedFileKey = computed(
  () => props.fileKey?.replace(/^storage:\/\//, '') || '',
);

const category = computed(() => inferAssetType(props.allowedExtensions));

const resolvedLabel = computed(
  () =>
    props.label ||
    (category.value && ASSET_TYPE_LABEL[category.value]) ||
    ASSET_TYPE_LABEL[AssetType.Other],
);

const resolvedIcon = computed(
  () =>
    props.icon ||
    (category.value && ASSET_TYPE_ICON[category.value]) ||
    ASSET_TYPE_ICON[AssetType.Other],
);

const emptyLabel = computed(() => {
  const cat = category.value;
  if (cat) return `Choose ${ASSET_TYPE_LABEL[cat].toLowerCase()}`;
  return 'Choose file';
});

const isPreviewEnabled = computed(
  () => props.showPreview || category.value === 'image',
);

const resolvedFileName = computed(() => {
  if (props.fileName) return props.fileName;
  if (!resolvedFileKey.value) return '';
  const segments = resolvedFileKey.value.split('__');
  return segments.length > 1
    ? segments.slice(1).join('__')
    : resolvedFileKey.value.split('/').pop() || '';
});

// Component will attempt to fetch signed url for preview if no public url is provided
const isLoadingPublicUrl = ref(false);
const internalPublicUrl = ref('');
const previewUrl = computed(() => props.publicUrl || internalPublicUrl.value || '');

watch(
  [resolvedFileKey, () => props.publicUrl],
  async ([key, propUrl]) => {
    if (!isPreviewEnabled.value || !key) return;
    if (propUrl) return;
    internalPublicUrl.value = '';
    isLoadingPublicUrl.value = true;
    try {
      internalPublicUrl.value = key ? await storageService?.getUrl(key) : '';
    } finally {
      isLoadingPublicUrl.value = false;
    }
  },
  { immediate: true },
);

const onUploadFile = (file: File) => upload(file);

const onSelect = (payload: Record<string, any>) => emit('input', payload);

// Emit both: @delete for explicit delete handling, @input null for value change
const onClear = () => {
  emit('delete');
  emit('input', null);
};
</script>

<style lang="scss" scoped>
.file-name {
  max-width: 10rem;
}
</style>
