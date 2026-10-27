<template>
  <PickerDialog
    :accept="acceptedFileTypes"
    :allow-url-source="allowUrlSource"
    :allowed-extensions="allowedExtensions"
    :heading="heading || resolvedLabel"
    :icon="icon || resolvedIcon"
    :initial-tab="initialTab"
    :is-uploading="uploading"
    :model-value="modelValue"
    :upload-error="error"
    :upload-progress="progress"
    @select="emit('select', $event)"
    @update:model-value="emit('update:modelValue', $event)"
    @upload="onUpload"
  />
</template>

<script lang="ts" setup>
import { computed, watch } from 'vue';
import { inferAssetType } from '@tailor-cms/interfaces/asset';

import { getAssetIcon, getAssetLabel } from '#utils';
import PickerDialog from './PickerDialog/index.vue';
import type { AssetPick, PickerTab } from './PickerDialog/index.vue';
import { useUpload } from '../../composables/useUpload';

export type { AssetPick, PickerTab };

interface Props {
  modelValue: boolean;
  // Accepted extensions with dot prefix (e.g. ['.jpg', '.png']); filters
  // the native file picker and the Library tab
  allowedExtensions?: string[];
  // Allow importing assets from an external URL
  allowUrlSource?: boolean;
  // Defaults to the label inferred from the extensions (e.g. "Image")
  heading?: string;
  // Defaults to the icon inferred from the extensions
  icon?: string;
  initialTab?: PickerTab;
}

const props = withDefaults(defineProps<Props>(), {
  allowedExtensions: () => [],
  allowUrlSource: false,
  heading: undefined,
  icon: undefined,
  initialTab: 'upload',
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  // Uploaded from the Upload tab
  'upload': [payload: AssetPick];
  // Picked from the Library or imported from a URL
  'select': [payload: AssetPick];
}>();

const { upload, uploading, progress, error } = useUpload(emit as any);

const category = computed(() => inferAssetType(props.allowedExtensions));
const resolvedLabel = computed(() => getAssetLabel(category.value));
const resolvedIcon = computed(() => getAssetIcon(category.value));
const acceptedFileTypes = computed(() => props.allowedExtensions.join(','));

// Discard a stale failure message from the previous session
watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) error.value = '';
  },
);

// Dialog stays open showing progress; on failure it remains
// open with the error so the user can retry
const onUpload = async (file: File) => {
  const payload = await upload(file);
  if (payload) emit('update:modelValue', false);
};
</script>
