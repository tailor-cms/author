<template>
  <div v-if="!fileKey">
    <template v-if="hasAssetLibrary">
      <VTextField
        v-if="inputAppearance"
        :density="density"
        :label="label"
        :placeholder="placeholder || 'Click to add...'"
        :prepend-inner-icon="icon"
        :variant="variant"
        append-inner-icon="mdi-upload"
        model-value=""
        readonly
        @click="dialogOpen = true"
      />
      <VBtn
        v-else
        :loading="uploading"
        :prepend-icon="icon"
        color="primary-darken-2"
        variant="tonal"
        block
        @click="dialogOpen = true"
      >
        {{ placeholder || label || 'Add file' }}
      </VBtn>
      <PickerDialog
        v-model="dialogOpen"
        :accept="acceptedFileTypes"
        :allow-url="allowUrl"
        :allowed-extensions="allowedExtensions"
        :asset-types="assetTypes"
        :heading="placeholder || label || 'Add file'"
        :icon="icon"
        @select="onSelect"
        @upload="onUploadFile"
      />
    </template>
    <VFileInput
      v-else
      :accept="acceptedFileTypes"
      :density="density"
      :label="placeholder || label"
      :loading="uploading ? 'primary' : false"
      :prepend-inner-icon="icon"
      :variant="variant"
      append-inner-icon="mdi-upload"
      prepend-icon="icon"
      @update:model-value="upload"
    />
  </div>
  <FilePreview
    v-else
    :dark="dark"
    :file-key="fileKey"
    :file-name="fileName"
    :icon="icon"
    :label="label"
    :show-preview="showPreview"
    @delete="deleteFile({ fileName })"
    @download="downloadFile(fileKey, fileName)"
  />
</template>

<script lang="ts" setup>
import { computed, inject, ref } from 'vue';
import FilePreview from './FilePreview.vue';
import PickerDialog from './PickerDialog/index.vue';
import { useUpload } from '../../composables/useUpload';
import type { VFileInput } from 'vuetify/components';

interface Props {
  // Meta input key identifier
  id: string;
  // Storage key of the selected file
  fileKey: string;
  // Display name of the selected file
  fileName: string;
  // Allowed file extensions (e.g. ['jpg', 'png'])
  ext?: string[];
  // Restrict library to specific asset types (e.g. ['image'])
  assetTypes?: string[];
  // Show URL tab in picker dialog
  allowUrl?: boolean;
  // Validation config from schema (fallback for ext via validate.ext)
  validate?: Record<string, any>;
  label: string;
  placeholder: string;
  icon?: string;
  variant?: VFileInput['variant'];
  density?: VFileInput['density'];
  // Dark theme context (sidebar)
  dark?: boolean;
  // Enable image thumbnail + lightbox
  showPreview?: boolean;
  // Render as text field instead of button (meta-input context)
  inputAppearance?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'outlined',
  density: 'default',
  icon: 'mdi-file',
  dark: false,
  showPreview: false,
  assetTypes: () => [],
  inputAppearance: false,
  allowUrl: false,
});

const emit = defineEmits(['upload', 'delete']);

const storageService = inject<any>('$storageService');
const { upload, deleteFile, downloadFile, uploading } = useUpload(emit);

const dialogOpen = ref(false);

const hasAssetLibrary = computed(() => !!storageService?.list);

const allowedExtensions = computed(
  () => props.ext || props.validate?.ext || [],
);

const acceptedFileTypes = computed(() =>
  allowedExtensions.value.length
    ? `.${allowedExtensions.value.join(',.')}`
    : '',
);

const onUploadFile = (file: File) => upload(file);

const onSelect = (payload: Record<string, any>) => emit('upload', payload);
</script>
