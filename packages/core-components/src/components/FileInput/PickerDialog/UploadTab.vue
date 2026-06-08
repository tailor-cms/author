<template>
  <div class="upload-tab-wrapper">
    <VFileUpload
      :filter-by-type="accept"
      browse-text="Browse files"
      class="upload-tab"
      icon="mdi-cloud-upload-outline"
      title="Drag & drop a file here"
      @update:model-value="onSelect"
    />
  </div>
</template>

<script lang="ts" setup>
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
  padding-bottom: 0;

  .upload-tab .v-sheet {
    padding: 2rem 1rem 3rem;
  }

  .v-file-upload-icon {
    margin-bottom: 0.75rem;

    .v-icon {
      font-size: 3.5rem;
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
