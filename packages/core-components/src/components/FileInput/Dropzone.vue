<template>
  <div class="file-dropzone">
    <UploadProgress
      v-if="isUploading"
      :file-name="fileName"
      :progress="progress"
    />
    <template v-else>
      <VAlert
        v-if="errorMessage"
        :text="errorMessage"
        class="mb-3"
        density="compact"
        type="error"
        variant="tonal"
      />
      <VFileUpload
        :disabled="disabled"
        :filter-by-type="accept"
        :scrim="false"
        class="file-dropzone-upload"
        color="transparent"
        icon=""
        rounded="lg"
        hide-details="auto"
        @update:model-value="onSelect"
      >
        <template #title>
          <VAvatar size="x-large" variant="tonal">
            <VIcon :icon="icon" size="28" />
          </VAvatar>
          <div class="mt-4 mb-1 font-weight-medium text-title-large">
            {{ title }}
          </div>
          <div class="text-body-medium text-medium-emphasis">
            Drag & drop anywhere in this block
            <template v-if="formats"> · {{ formats }}</template>
          </div>
        </template>
        <template #browse="{ props: browseProps }">
          <div class="d-flex flex-wrap justify-center ga-2 mt-4">
            <VBtn
              v-bind="browseProps"
              color="primary"
              prepend-icon="mdi-upload"
              size="default"
              text="Upload"
              variant="tonal"
            />
            <VBtn
              size="default"
              text="Library"
              variant="tonal"
              @click.stop="emit('open', 'library')"
            />
            <VBtn
              v-if="allowUrlSource"
              size="default"
              text="From URL"
              variant="tonal"
              @click.stop="emit('open', 'url')"
            />
          </div>
        </template>
      </VFileUpload>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { uniq } from 'lodash-es';

import UploadProgress from './PickerDialog/UploadProgress.vue';

interface Props {
  title: string;
  icon: string;
  // Accepted extensions with dot prefix (e.g. ['.jpg', '.png'])
  extensions?: string[];
  allowUrlSource?: boolean;
  disabled?: boolean;
  isUploading?: boolean;
  // Upload percent complete; null renders an indeterminate bar
  progress?: number | null;
  errorMessage?: string;
}

const props = withDefaults(defineProps<Props>(), {
  extensions: () => [],
  allowUrlSource: false,
  disabled: false,
  isUploading: false,
  progress: null,
  errorMessage: '',
});

const emit = defineEmits<{
  select: [file: File];
  // Open the picker dialog on the given tab
  open: [tab: 'library' | 'url'];
}>();

// Name of the picked file; shown by the progress panel while uploading.
const fileName = ref('');

// Native picker filter
const accept = computed(() => props.extensions.join(','));

// Accepted formats as the user reads them: "JPG, PNG, or GIF"
const listFormat = new Intl.ListFormat('en', { type: 'disjunction' });
const formats = computed(() => {
  const names = props.extensions.map((it) => it.replace(/^\./, '').toUpperCase());
  return listFormat.format(uniq(names));
});

const onSelect = (files: File | File[] | null) => {
  if (!files) return;
  const file = Array.isArray(files) ? files[0] : files;
  if (!file) return;
  fileName.value = file.name;
  emit('select', file);
};
</script>

<style lang="scss" scoped>
// VFileUpload puts classes on its input root, not the dropzone sheet, so the
// sheet's spacing and rest/drag border are set here. Placeholder-like at
// rest; the dashed target only shows while a file is dragged over it.
.file-dropzone-upload :deep(.v-file-upload-dropzone) {
  padding: 1.5rem;
  border-color: transparent;
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease;

  &.v-file-upload-dropzone--dragging {
    background: rgba(var(--v-theme-primary), 0.06);
    border-color: rgb(var(--v-theme-primary));
  }

  .v-file-upload-divider {
    display: none;
  }
}
</style>
