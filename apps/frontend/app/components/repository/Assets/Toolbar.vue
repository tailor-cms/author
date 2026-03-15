<template>
  <div class="toolbar d-flex align-center flex-wrap ga-4 mb-6">
    <VHover v-slot="{ isHovering, props: hoverProps }">
      <VFileInput
        v-model="selectedFiles"
        v-bind="hoverProps"
        :bg-color="isHovering ? 'primary-darken-1' : 'primary-darken-2'"
        class="file-input"
        density="comfortable"
        label="Select files to upload"
        prepend-icon=""
        prepend-inner-icon="mdi-paperclip"
        rounded="xl"
        variant="solo"
        hide-details
        flat
        multiple
      />
    </VHover>
    <VBtn
      :disabled="!selectedFiles?.length"
      :loading="isUploading"
      color="primary-lighten-3"
      prepend-icon="mdi-upload"
      variant="outlined"
      @click="uploadFiles"
    >
      Upload
    </VBtn>
    <VBtn
      color="primary-lighten-3"
      prepend-icon="mdi-link-plus"
      variant="outlined"
      @click="$emit('add-link')"
    >
      Add Link
    </VBtn>
    <VBtn
      color="primary-lighten-3"
      prepend-icon="mdi-earth-plus"
      variant="outlined"
      @click="$emit('discover')"
    >
      Discover
    </VBtn>
  </div>
</template>

<script lang="ts" setup>
const emit = defineEmits(['upload', 'add-link', 'discover']);

const isUploading = ref(false);
const selectedFiles = ref<File[]>([]);

async function uploadFiles() {
  if (!selectedFiles.value?.length) return;
  isUploading.value = true;
  emit('upload', selectedFiles.value);
}

function reset() {
  selectedFiles.value = [];
  isUploading.value = false;
}

defineExpose({ reset });
</script>

<style lang="scss" scoped>
.file-input {
  min-width: 17.5rem;
  max-width: 26.25rem;
}

:deep(input::placeholder) {
  opacity: 0.75;
}
</style>
