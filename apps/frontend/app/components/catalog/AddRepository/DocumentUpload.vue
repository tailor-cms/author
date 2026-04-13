<template>
  <div class="document-upload mb-6">
    <div class="mb-3 text-body-2 font-weight-bold">
      Source documents (optional):
    </div>
    <div class="text-caption mb-3">
      Upload PDF files to generate content based on your existing materials.
    </div>
    <VFileInput
      v-model="files"
      :disabled="progress.isActive"
      accept=".pdf"
      label="Select PDF files"
      prepend-icon="mdi-file-document-outline"
      variant="outlined"
      chips
      counter
      multiple
      show-size
    >
      <template v-if="progress.message" #message>
        <span :class="progress.message.color">
          <VIcon :icon="progress.message.icon" class="mr-1" size="small" />
          {{ progress.message.text }}
        </span>
      </template>
    </VFileInput>
    <div v-if="progress.isActive" class="mt-3 px-1">
      <div class="d-flex align-center justify-space-between mb-1">
        <span class="text-body-2">{{ progress.label }}</span>
        <span
          v-if="progress.status === Status.Indexing"
          class="text-body-2 text-medium-emphasis"
        >
          {{ progress.val }}%
        </span>
      </div>
      <VProgressLinear
        :indeterminate="progress.status === Status.Uploading"
        :model-value="progress.val"
        color="primary-darken-2"
        height="6"
        rounded
      />
      <p
        v-if="progress.status === Status.Indexing"
        class="text-caption text-medium-emphasis mt-2 mb-0"
      >
        This may take a few minutes depending on file size.
        <a :href="currentPath" class="text-primary" target="_blank">
          Continue working in a new tab
        </a>
        while documents are being processed.
      </p>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { Status, useDocumentProcessing } from './useDocumentProcessing';

const emit = defineEmits<{
  'doc:uploaded': [value: string];
  'doc:processing': [value: boolean];
}>();

const currentPath = useRoute().path;
const { files, progress } = useDocumentProcessing(emit);
</script>
