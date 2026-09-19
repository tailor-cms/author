<template>
  <Dropzone
    v-if="isDropzone && !resolvedFileKey"
    :allow-url-source="allowUrlSource"
    :disabled="readonly"
    :error-message="uploadError"
    :extensions="allowedExtensions"
    :icon="resolvedIcon"
    :is-uploading="uploading"
    :progress="progress"
    :title="dropzoneTitle"
    @open="openDialog"
    @select="onUploadFile"
  />
  <VTextField
    v-else-if="!resolvedFileKey"
    :density="density"
    :label="resolvedLabel"
    :max-width="maxWidth"
    :min-width="minWidth"
    :placeholder="placeholder || 'Click to add...'"
    :prepend-inner-icon="resolvedIcon"
    :variant="variant"
    readonly
    @click="!readonly && openDialog()"
  />
  <div v-else-if="isDropzone && $slots.default">
    <slot
      :file-name="resolvedFileName"
      :is-loading="isLoadingPublicUrl"
      :url="previewUrl"
    />
    <VExpandTransition>
      <VSheet
        v-if="showActions && !readonly"
        class="bottom-0 pa-3 pl-1 mb-n3"
        color="surface-raised"
        position="sticky"
      >
        <div class="d-flex align-center ga-2">
          <VIcon :icon="resolvedIcon" size="small" />
          <span class="text-body-small text-medium-emphasis text-truncate">
            {{ resolvedFileName }}
          </span>
          <VSpacer />
          <div class="d-flex align-center mr-n3">
            <slot name="actions" :remove="onClear" :replace="openDialog">
              <VBtn
                prepend-icon="mdi-swap-horizontal"
                size="small"
                text="Replace"
                variant="text"
                @click="openDialog()"
              />
              <VBtn
                color="error"
                prepend-icon="mdi-trash-can-outline"
                size="small"
                text="Remove"
                variant="text"
                @click="onClear"
              />
            </slot>
          </div>
        </div>
      </VSheet>
    </VExpandTransition>
  </div>
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
    :readonly="readonly"
    @delete="onClear"
    @download="downloadFile(resolvedFileKey, resolvedFileName)"
    @replace="openDialog()"
  />
  <PickerDialog
    v-model="dialogOpen"
    :accept="acceptedFileTypes"
    :allow-url-source="allowUrlSource"
    :allowed-extensions="allowedExtensions"
    :heading="dialogHeading"
    :icon="resolvedIcon"
    :initial-tab="dialogTab"
    :is-uploading="uploading"
    :upload-error="uploadError"
    :upload-progress="progress"
    @select="onSelect"
    @upload="onUploadFile"
  />
</template>

<script lang="ts" setup>
import { computed, inject, ref, watch } from 'vue';
import { AssetType, inferAssetType } from '@tailor-cms/interfaces/asset';
import Dropzone from './Dropzone.vue';
import FilePreview from './FilePreview.vue';
import PickerDialog from './PickerDialog/index.vue';
import type { PickerTab } from './PickerDialog/index.vue';
import { useUpload } from '../../composables/useUpload';

import {
  getAssetDropzoneTitle,
  getAssetIcon,
  getAssetLabel,
} from '#utils';
import type { VTextField } from 'vuetify/components';

defineOptions({ inheritAttrs: false });

interface Props {
  // Current value: a storage reference (storage:// URI or a bare storage key,
  // both signed for preview) or an external URL (rendered as-is). External is
  // detected by the http(s):// scheme; everything else is treated as a key.
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
  // 'field': a form control; the empty state is a click-to-add text field.
  // 'dropzone': an inline drag & drop area for the empty state, while the
  // filled state renders the media from the default slot with a file name +
  // replace/remove row beneath it (falls back to the file card without a slot).
  mode?: 'field' | 'dropzone';
  // Dropzone mode: whether the replace/remove row is shown below the media;
  // bind to the element's focus state
  showActions?: boolean;
  // Vuetify props passed to VTextField (empty state in field input mode)
  variant?: VTextField['variant'];
  density?: VTextField['density'];
  // Dark theme variant for the file preview card
  dark?: boolean;
  // Minimum width of the input and preview field; optional
  minWidth?: string | number;
  // Maximum width of the input and preview field; optional
  maxWidth?: string | number;
  // Read-only mode; disables input interactions
  readonly?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  allowedExtensions: () => [],
  useFieldInput: false,
  allowUrlSource: false,
  publicUrl: null,
  showPreview: false,
  mode: 'field',
  showActions: true,
  variant: 'outlined',
  density: 'default',
  dark: false,
  minWidth: '287',
  maxWidth: '100%',
  readonly: false,
});

const emit = defineEmits<{
  upload: [value: Record<string, any>];
  input: [value: Record<string, any> | null];
  delete: [];
}>();

const storageService = inject<any>('$storageService');
const {
  upload,
  uploading,
  progress,
  error: uploadError,
  downloadFile,
} = useUpload(emit as any);

const dialogOpen = ref(false);
const dialogTab = ref<PickerTab>('upload');

const openDialog = (tab: PickerTab = 'upload') => {
  dialogTab.value = tab;
  dialogOpen.value = true;
};

const isDropzone = computed(() => props.mode === 'dropzone');

// Discard a stale failure message from the previous session
watch(dialogOpen, (isOpen) => {
  if (isOpen) uploadError.value = '';
});

const dialogHeading = computed(() => {
  const base = props.placeholder || resolvedLabel.value;
  return resolvedFileKey.value ? `Change ${base.toLowerCase()}` : base;
});

const acceptedFileTypes = computed(() => props.allowedExtensions.join(','));

// External URLs are rendered as-is; any other value (storage:// URI or a bare
// storage key) is a storage reference that gets stripped and signed. Testing
// the http(s) scheme positively tolerates the prefix being present or not.
const isExternalUrl = computed(() => /^https?:\/\//.test(props.fileKey || ''));

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

const dropzoneTitle = computed(() => getAssetDropzoneTitle(category.value));

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

const isLoadingPublicUrl = ref(false);
const internalPublicUrl = ref('');
const previewUrl = computed(() => props.publicUrl || internalPublicUrl.value || '');

watch(
  [resolvedFileKey, () => props.publicUrl],
  async ([key, propUrl]) => {
    if (!isPreviewEnabled.value || !key) return;
    if (propUrl) return;
    // External URLs are rendered as-is; storage references need signing.
    if (isExternalUrl.value) {
      internalPublicUrl.value = key;
      return;
    }
    internalPublicUrl.value = '';
    isLoadingPublicUrl.value = true;
    try {
      internalPublicUrl.value = await storageService?.getUrl(key);
    } finally {
      isLoadingPublicUrl.value = false;
    }
  },
  { immediate: true },
);

// Dialog stays open showing progress; on failure it remains
// open with the error so the user can retry
const onUploadFile = async (file: File) => {
  const payload = await upload(file);
  if (payload) dialogOpen.value = false;
};

const onSelect = (payload: Record<string, any>) => emit('input', payload);

// Emit both: @delete for explicit delete handling, @input null for value change
const onClear = () => {
  emit('delete');
  emit('input', null);
};
</script>
