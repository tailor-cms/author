<template>
  <div class="upload-tab-wrapper">
    <UploadProgress v-if="isUploading" :file-name="fileName" :progress="progress" />
    <template v-else>
      <VAlert
        v-if="errorMessage"
        :text="errorMessage"
        class="mb-4"
        density="compact"
        type="error"
        variant="tonal"
      />
      <VDefaultsProvider :defaults="{ VBtn: { color: 'primary' } }">
        <VFileUpload
          :filter-by-type="accept"
          browse-text="Browse files"
          class="upload-tab"
          icon="mdi-cloud-upload-outline"
          title="Drag & drop a file here"
          @update:model-value="onSelect"
        />
      </VDefaultsProvider>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';

import UploadProgress from './UploadProgress.vue';

interface Props {
  accept?: string;
  isUploading?: boolean;
  // Upload percent complete; null renders an indeterminate bar
  progress?: number | null;
  errorMessage?: string;
}

withDefaults(defineProps<Props>(), {
  accept: '',
  isUploading: false,
  progress: null,
  errorMessage: '',
});

const emit = defineEmits<{
  select: [file: File];
}>();

// Name of the picked file; shown by the progress panel while uploading.
const fileName = ref('');

const onSelect = (files: File | File[] | null) => {
  if (!files) return;
  const file = Array.isArray(files) ? files[0] : files;
  if (!file) return;
  fileName.value = file.name;
  emit('select', file);
};
</script>

<style lang="scss">
.upload-tab-wrapper {
  padding: 1rem;
  padding-bottom: 0;

  .upload-tab .v-file-upload-dropzone.v-sheet {
    background: rgb(var(--v-theme-surface-container-low));
    border-color: rgba(var(--v-border-color), 0.26);
    border-radius: 12px;
    padding: 2rem 1rem 3rem;
    transition:
      border-color 0.2s ease,
      background-color 0.2s ease;

    &:hover,
    &.v-file-upload-dropzone--dragging {
      background: rgba(var(--v-theme-primary), 0.06);
      border-color: rgb(var(--v-theme-primary));
    }
  }

  .v-file-upload-icon {
    margin-bottom: 0.75rem;
    opacity: 1;

    .v-icon {
      color: rgb(var(--v-theme-primary));
      font-size: 3.5rem;
      opacity: 0.85;
    }
  }

  .v-file-upload-title {
    font-size: 1.25rem;
  }

  .v-file-upload-divider {
    margin: 1.25rem 0;
  }
}
</style>
