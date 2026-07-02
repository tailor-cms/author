<template>
  <div class="asset-toolbar d-flex align-center flex-wrap ga-3">
    <VTextField
      v-model="search"
      bg-color="transparent"
      class="search-input"
      density="comfortable"
      max-width="384"
      min-width="220"
      placeholder="Search assets..."
      prepend-inner-icon="mdi-magnify"
      rounded="pill"
      variant="solo-filled"
      clearable
      flat
      hide-details
      @click:clear="search = ''"
    />
    <VSpacer />
    <VMenu :offset="6" location="bottom end">
      <template #activator="{ props: menuProps }">
        <VBtn
          v-bind="menuProps"
          color="primary"
          data-testid="newMenuBtn"
          prepend-icon="mdi-plus"
          text="New"
          variant="flat"
        />
      </template>
      <VList density="compact" min-width="200" nav>
        <VListItem
          data-testid="uploadAction"
          prepend-icon="mdi-upload"
          title="Upload files"
          @click="openFilePicker"
        />
        <VListItem
          data-testid="addLinkAction"
          prepend-icon="mdi-link-plus"
          title="Add link"
          @click="emit('link:add')"
        />
        <VListItem
          v-if="isDiscoveryEnabled"
          data-testid="discoverAction"
          prepend-icon="mdi-web-plus"
          title="Discover"
          @click="emit('discover')"
        />
        <VDivider class="my-1" />
        <VListItem
          data-testid="newFolderAction"
          prepend-icon="mdi-folder-plus-outline"
          title="New folder"
          @click="emit('folder:new')"
        />
      </VList>
    </VMenu>
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
  'folder:new': [];
}>();

const config = useConfigStore();
const search = defineModel<string>('search', { default: '' });

const fileInputRef = ref<HTMLInputElement>();

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
  emit('upload', [...files]);
  input.value = '';
}
</script>

<style lang="scss" scoped>
.search-input {
  min-width: 10rem;
  max-width: 16rem;
}
</style>
