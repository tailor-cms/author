<template>
  <div class="asset-toolbar d-flex align-center flex-wrap ga-3">
    <VTextField
      v-model="search"
      bg-color="transparent"
      class="search-input"
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
    <VSpacer />
    <VBtn
      :loading="isUploading"
      :disabled="isUploading"
      color="secondary"
      prepend-icon="mdi-upload"
      size="small"
      text="Upload"
      variant="tonal"
      @click="openFilePicker"
    />
    <VBtn
      color="secondary"
      prepend-icon="mdi-link-plus"
      size="small"
      text="Add Link"
      variant="tonal"
      @click="emit('link:add')"
    />
    <VBtn
      v-if="isDiscoveryEnabled"
      color="secondary"
      prepend-icon="mdi-earth-plus"
      variant="tonal"
      text="Discover"
      size="small"
      @click="emit('discover')"
    />
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
const emit = defineEmits<{
  'upload': [files: File[]];
  'link:add': [];
  'discover': [];
}>();

const config = useConfigStore();
const search = defineModel<string>('search', { default: '' });

const fileInputRef = ref<HTMLInputElement>();
const isUploading = ref(false);

const isDiscoveryEnabled = computed(
  () => !!config.props.discoveryEnabled,
);

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
