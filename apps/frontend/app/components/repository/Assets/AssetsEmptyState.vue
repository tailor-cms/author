<template>
  <TailorEmptyState
    v-bind="$attrs"
    height="auto"
    text="Upload files from your device, reference them by link, or pull
      them in from the web."
    text-width="440"
    title="No assets yet"
    variant="text"
  >
    <template #actions>
      <div class="actions d-flex flex-wrap justify-center ga-4 mt-4">
        <EmptyStateCard
          v-for="option in options"
          :key="option.key"
          :icon="option.icon"
          :test-id="option.testId"
          :text="option.text"
          :title="option.title"
          @click="option.open"
        />
      </div>
    </template>
  </TailorEmptyState>
  <input
    ref="fileInputRef"
    type="file"
    class="d-none"
    multiple
    @change="onFilesSelected"
  />
</template>

<script lang="ts" setup>
import { TailorEmptyState } from '@tailor-cms/core-components';

import EmptyStateCard from '@/components/common/EmptyStateCard.vue';
import { useConfigStore } from '@/stores/config';

const emit = defineEmits<{
  'upload': [files: File[]];
  'link:add': [];
  'discover': [];
  'folder:new': [];
}>();

const config = useConfigStore();

const fileInputRef = ref<HTMLInputElement>();

const isDiscoveryEnabled = computed(() => !!config.props.discoveryEnabled);

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

const options = computed(() => [
  {
    key: 'upload',
    title: 'Upload files',
    text: 'Add files from your device.',
    icon: 'mdi-upload',
    testId: 'assets__emptyUpload',
    open: openFilePicker,
  },
  {
    key: 'link',
    title: 'Add link',
    text: 'Reference a file by its URL.',
    icon: 'mdi-link-plus',
    testId: 'assets__emptyLink',
    open: () => emit('link:add'),
  },
  ...(isDiscoveryEnabled.value
    ? [
        {
          key: 'discover',
          title: 'Discover',
          text: 'Pull in files from the web.',
          icon: 'mdi-web-plus',
          testId: 'assets__emptyDiscover',
          open: () => emit('discover'),
        },
      ]
    : []),
  {
    key: 'folder',
    title: 'New folder',
    text: 'Group assets into folders.',
    icon: 'mdi-folder-plus-outline',
    testId: 'assets__emptyFolder',
    open: () => emit('folder:new'),
  },
]);
</script>

<style lang="scss" scoped>
.actions {
  max-width: 1000px;
}
</style>
