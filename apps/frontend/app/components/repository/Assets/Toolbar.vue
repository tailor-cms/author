<template>
  <div class="asset-toolbar d-flex align-center flex-wrap ga-3">
    <VTextField
      v-model="search"
      bg-color="transparent"
      class="search-input"
      density="compact"
      placeholder="Search assets..."
      min-width="220"
      prepend-inner-icon="mdi-magnify"
      rounded="pill"
      variant="solo-filled"
      clearable
      flat
      hide-details
      @click:clear="search = ''"
    />
    <VSpacer />
    <VBtn
      color="secondary"
      prepend-icon="mdi-link-plus"
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
      @click="emit('discover')"
    />
    <VBtn
      :loading="isUploading"
      :disabled="isUploading"
      color="primary"
      prepend-icon="mdi-upload"
      text="Upload"
      variant="flat"
      @click="openFilePicker"
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
