<template>
  <div class="toolbar d-flex align-center flex-wrap ga-3 mb-6">
    <VTextField
      v-model="search"
      bg-color="primary-darken-2"
      class="search-input"
      color="primary-lighten-3"
      density="comfortable"
      placeholder="Search assets..."
      prepend-inner-icon="mdi-magnify"
      rounded="xl"
      variant="solo"
      clearable
      flat
      hide-details
      @click:clear="search = ''"
    />
    <VBtn
      :loading="isUploading"
      color="primary-lighten-3"
      prepend-icon="mdi-upload"
      variant="outlined"
      @click="openFilePicker"
    >
      Upload
    </VBtn>
    <VBtn
      color="primary-lighten-3"
      prepend-icon="mdi-link-plus"
      variant="outlined"
      @click="emit('link:add')"
    >
      Add Link
    </VBtn>
    <VBtn
      color="primary-lighten-3"
      prepend-icon="mdi-earth-plus"
      variant="outlined"
      @click="emit('discover')"
    >
      Discover
    </VBtn>
    <input
      ref="fileInputRef"
      type="file"
      class="d-none"
      multiple
      @change="onFilesSelected"
    />
  </div>
</template>

<script lang="ts" setup>
const emit = defineEmits(['upload', 'link:add', 'discover']);

const search = defineModel<string>('search', { default: '' });

const isUploading = ref(false);
const fileInputRef = ref<HTMLInputElement>();

function openFilePicker() {
  fileInputRef.value?.click();
}

function onFilesSelected(event: Event) {
  const input = event.target as HTMLInputElement;
  const files = input.files;
  if (!files?.length) return;
  isUploading.value = true;
  emit('upload', [...files]);
  input.value = '';
}

function reset() {
  isUploading.value = false;
}

defineExpose({ reset });
</script>

<style lang="scss" scoped>
.search-input {
  min-width: 10rem;
  max-width: 16rem;
}
</style>
