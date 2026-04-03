<template>
  <div class="upload-tab-wrapper">
    <VFileUpload
      :filter-by-type="accept"
      browse-text="Browse files"
      class="upload-tab"
      divider-text="or"
      icon="mdi-cloud-upload-outline"
      title="Drag & drop a file here"
      @update:model-value="onSelect"
    >
      <template #browse="{ props: browseProps }">
        <VBtn
          v-bind="browseProps"
          color="primary-darken-3"
          variant="flat"
        />
      </template>
    </VFileUpload>
  </div>
</template>

<script lang="ts" setup>
import { VFileUpload } from 'vuetify/labs/VFileUpload';

defineProps<{ accept?: string }>();

const emit = defineEmits<{
  select: [file: File];
}>();

const onSelect = (files: File | File[] | null) => {
  if (!files) return;
  const file = Array.isArray(files) ? files[0] : files;
  if (file) emit('select', file);
};
</script>

<style lang="scss">
.upload-tab-wrapper {
  padding: 2rem;
  background: transparent;

  .upload-tab.v-sheet {
    padding: 3rem 1rem;
    border: 2px dashed rgba(var(--v-theme-primary), 0.25) !important;
    border-radius: 8px;
    background: transparent;
  }

  .v-file-upload-icon {
    margin-bottom: 0.75rem;
    font-size: 3rem;
    color: rgb(var(--v-theme-primary-darken-2));

    .v-icon {
      color: inherit;
      font-size: inherit;
    }
  }

  .v-file-upload-title {
    font-size: 1.125rem;
    font-weight: 500;
    color: rgb(var(--v-theme-primary-darken-4));
  }

  .v-file-upload-divider {
    margin: 1.25rem 0;
    color: rgb(var(--v-theme-primary-darken-4));
    opacity: 0.9;
  }
}
</style>
