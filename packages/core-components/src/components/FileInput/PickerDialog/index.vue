<template>
  <TailorDialog
    :model-value="modelValue"
    :header-icon="icon"
    :persistent="isUploading"
    :theme="$vuetify.theme.global.name"
    :title="heading"
    width="800"
    @close="onClose"
  >
    <template #subheader>
      <div class="px-5 pb-2">
        <VTabs
          v-model="activeTab"
          :disabled="isUploading"
          selected-class="bg-surface-container-high"
          color=""
          grow
          hide-slider
        >
          <VTab value="upload" class="mr-2" prepend-icon="mdi-upload" text="Upload" />
          <VTab
            value="library"
            class="mx-2"
            prepend-icon="mdi-folder-multiple-image"
            text="Library"
          />
          <VTab
            v-if="allowUrlSource"
            value="url"
            class="ml-2"
            prepend-icon="mdi-link-variant"
            text="URL"
          />
        </VTabs>
      </div>
    </template>
    <template #body>
      <VTabsWindow :key="sessionKey" v-model="activeTab">
        <VTabsWindowItem value="upload">
          <UploadTab
            :accept="accept"
            :error-message="uploadError"
            :is-uploading="isUploading"
            :progress="uploadProgress"
            @select="emit('upload', $event)"
          />
        </VTabsWindowItem>
        <VTabsWindowItem value="library" eager>
          <LibraryTab
            v-model:selected="selectedAssets"
            :allowed-extensions="allowedExtensions"
            :multiple="multiple"
          />
        </VTabsWindowItem>
        <VTabsWindowItem v-if="allowUrlSource" value="url">
          <UrlTab ref="urlTabRef" @submit="onUrlSubmit" />
        </VTabsWindowItem>
      </VTabsWindow>
    </template>
    <template #actions>
      <div class="px-2 pb-3">
        <VBtn
          :disabled="isUploading"
          text="Cancel"
          variant="text"
          @click="onClose"
        />
        <VBtn
          v-if="activeTab === 'library'"
          :disabled="!hasSelection"
          :text="selectLabel"
          class="ml-2 px-4"
          color="primary"
          variant="flat"
          @click="onAssetPick"
        />
        <VBtn
          v-if="activeTab === 'url'"
          color="primary"
          class="ml-2"
          text="Submit"
          variant="flat"
          @click="urlTabRef?.submit()"
        />
      </div>
    </template>
  </TailorDialog>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import type { Asset } from '@tailor-cms/interfaces/asset';

import TailorDialog from '../../TailorDialog.vue';
import LibraryTab from './LibraryTab/index.vue';
import UploadTab from './UploadTab.vue';
import UrlTab from './UrlTab.vue';

interface Props {
  modelValue: boolean;
  heading?: string;
  icon?: string;
  // MIME/extension filter for the native file picker
  // accept attribute (e.g. '.jpg,.png,image/*')
  accept?: string;
  // Extension whitelist for the Library tab (e.g. ['.jpg', '.png'])
  // Used to infer asset type for filtering and to disable incompatible items
  allowedExtensions?: string[];
  allowUrlSource?: boolean;
  multiple?: boolean;
  // Upload in progress; keeps the dialog open and shows progress
  isUploading?: boolean;
  // Upload percent complete; null renders an indeterminate bar
  uploadProgress?: number | null;
  // Upload failure message shown on the Upload tab
  uploadError?: string;
}

const props = withDefaults(defineProps<Props>(), {
  heading: 'Add file',
  icon: 'mdi-file',
  accept: '',
  allowedExtensions: () => [],
  allowUrlSource: false,
  multiple: false,
  isUploading: false,
  uploadProgress: null,
  uploadError: '',
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'upload': [file: File];
  // Single asset picked from Library or URL imported
  'select': [payload: Record<string, any>];
  // Multiple assets picked from Library (when multiple prop is enabled)
  'select:multiple': [payload: Record<string, any>[]];
}>();

// Incremented on each open; remounts tab content for fresh state
const sessionKey = ref(0);
const activeTab = ref('upload');
const selectedAssets = ref<Asset | Asset[] | null>(null);
const urlTabRef = ref<InstanceType<typeof UrlTab> | null>(null);

const hasSelection = computed(() => {
  if (Array.isArray(selectedAssets.value))
    return selectedAssets.value.length > 0;
  return !!selectedAssets.value;
});

const selectLabel = computed(() => {
  if (!props.multiple) return 'Select';
  const count = Array.isArray(selectedAssets.value)
    ? selectedAssets.value.length
    : 0;
  return count ? `Select (${count})` : 'Select';
});

const onClose = () => {
  if (props.isUploading) return;
  emit('update:modelValue', false);
};

const toPayload = (asset: any) => ({
  key: asset.storageKey,
  name: asset.name,
  url: asset.url,
  publicUrl: asset.publicUrl || null,
});

const onAssetPick = () => {
  if (!hasSelection.value) return;
  if (props.multiple) {
    emit('select:multiple', (selectedAssets.value as Asset[]).map(toPayload));
  } else {
    emit('select', toPayload(selectedAssets.value as Asset));
  }
  onClose();
};

const onUrlSubmit = (data: { url: string; title?: string }) => {
  emit('select', data);
  onClose();
};

// Fresh tab content, tab selection, and library selection on each
// dialog open (close may be programmatic, so reset happens here)
watch(
  () => props.modelValue,
  (open) => {
    if (!open) return;
    sessionKey.value++;
    activeTab.value = 'upload';
    selectedAssets.value = props.multiple ? [] : null;
  },
);
</script>
