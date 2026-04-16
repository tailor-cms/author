<template>
  <VTextField
    v-if="!resolvedFileKey"
    :density="density"
    :label="resolvedLabel"
    :max-width="maxWidth"
    :min-width="minWidth"
    :placeholder="placeholder || 'Click to add...'"
    :prepend-inner-icon="resolvedIcon"
    :variant="variant"
    append-inner-icon="mdi-upload"
    readonly
    @click="dialogOpen = true"
  />
  <FilePreview
    v-else
    :density="density"
    :dark="dark"
    :file-name="resolvedFileName"
    :icon="resolvedIcon"
    :label="resolvedLabel"
    :is-loading="isLoadingPublicUrl"
    :min-width="minWidth"
    :max-width="maxWidth"
    :show-preview="isPreviewEnabled"
    :url="previewUrl"
    :variant="variant"
    @delete="onClear"
    @download="downloadFile(resolvedFileKey, resolvedFileName)"
  />
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

import { getAssetIcon, getAssetLabel } from '#utils';
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
  // Minimum width of the input and preview field; defaults to 350px
  minWidth?: string | number;
  // Maximum width of the input and preview field; optional
  maxWidth?: string | number;
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
  maxWidth: '100%',
  minWidth: '350',
});

const emit = defineEmits<{
  upload: [value: Record<string, any>];
  input: [value: Record<string, any> | null];
  delete: [];
}>();

const storageService = inject<any>('$storageService');
const { upload, downloadFile } = useUpload(emit as any);

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
  () => props.label || getAssetLabel(category.value),
);

const resolvedIcon = computed(
  () => props.icon || getAssetIcon(category.value),
);

const isPreviewEnabled = computed(
  () => props.showPreview || category.value === AssetType.Image,
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
