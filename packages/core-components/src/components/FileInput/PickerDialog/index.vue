<template>
  <TailorDialog
    :model-value="modelValue"
    :header-icon="icon"
    width="800"
    paddingless
    @close="onClose"
  >
    <template #header>{{ heading }}</template>
    <template #body>
      <div class="bg-primary-darken-3 px-5 pb-5">
        <VTabs
          v-model="activeTab"
          bg-color="primary-darken-3"
          selected-class="bg-primary-darken-2"
          grow
          hide-slider
        >
          <VTab value="upload" class="mr-2" color="primary-lighten-5">
            <VIcon class="mr-2" size="small">mdi-upload</VIcon>
            Upload
          </VTab>
          <VTab value="library" class="mx-2" color="primary-lighten-5">
            <VIcon class="mr-2" size="small">mdi-folder-multiple-image</VIcon>
            Library
          </VTab>
          <VTab
            v-if="allowUrl"
            value="url"
            class="ml-2"
            color="primary-lighten-5"
          >
            <VIcon class="mr-2" size="small">mdi-link-variant</VIcon>
            URL
          </VTab>
        </VTabs>
      </div>
      <VWindow :key="sessionKey" v-model="activeTab">
        <VWindowItem value="upload">
          <UploadTab :accept="accept" @select="onFileSelect" />
        </VWindowItem>
        <VWindowItem value="library" eager>
          <LibraryTab
            v-model:selected="selectedAssets"
            :allowed-extensions="allowedExtensions"
            :asset-types="assetTypes"
            :multiple="multiple"
          />
        </VWindowItem>
        <VWindowItem v-if="allowUrl" value="url">
          <UrlTab ref="urlTabRef" @import="onUrlSelect" />
        </VWindowItem>
      </VWindow>
    </template>
    <template #actions>
      <div class="px-2 pb-3">
        <VBtn color="primary-darken-4" variant="text" @click="onClose">
          Cancel
        </VBtn>
        <VBtn
          v-if="activeTab === 'library'"
          :disabled="!hasSelection"
          class="ml-2 px-4"
          color="primary-darken-2"
          variant="tonal"
          @click="onAssetPick"
        >
          {{ selectLabel }}
        </VBtn>
        <VBtn
          v-if="activeTab === 'url'"
          class="ml-2"
          color="primary-darken-2"
          variant="tonal"
          @click="urlTabRef?.submit()"
        >
          Import
        </VBtn>
      </div>
    </template>
  </TailorDialog>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';

import TailorDialog from '../../TailorDialog.vue';
import LibraryTab from './LibraryTab/index.vue';
import UploadTab from './UploadTab.vue';
import UrlTab from './UrlTab.vue';

interface Props {
  modelValue: boolean;
  heading?: string;
  icon?: string;
  accept?: string;
  assetTypes?: string[];
  allowedExtensions?: string[];
  allowUrl?: boolean;
  multiple?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  heading: 'Add file',
  icon: 'mdi-file',
  accept: '',
  assetTypes: () => [],
  allowedExtensions: () => [],
  allowUrl: false,
  multiple: false,
});

const emit = defineEmits<{
  // Dialog open/close state (v-model)
  (e: 'update:modelValue', value: boolean): void;
  // File chosen via Upload tab - parent handles the upload to storage
  (e: 'upload', file: File): void;
  // Single asset picked from Library or URL imported
  (e: 'select', payload: Record<string, any>): void;
  // Multiple assets picked from Library (when multiple prop is enabled)
  (e: 'select:multiple', payload: Record<string, any>[]): void;
}>();

// Incremented on each open; remounts tab content for fresh state
const sessionKey = ref(0);
const activeTab = ref('upload');
const selectedAssets = ref<any>(null);
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
  emit('update:modelValue', false);
  activeTab.value = 'upload';
  selectedAssets.value = props.multiple ? [] : null;
};

const onFileSelect = (file: File) => {
  emit('upload', file);
  onClose();
};

const toPayload = (asset: any) => ({
  key: asset.storageKey,
  name: asset.name,
});

const onAssetPick = () => {
  if (!hasSelection.value) return;
  if (props.multiple && Array.isArray(selectedAssets.value)) {
    emit('select:multiple', selectedAssets.value.map(toPayload));
  } else {
    const asset = Array.isArray(selectedAssets.value)
      ? selectedAssets.value[0]
      : selectedAssets.value;
    if (!asset?.storageKey) return;
    emit('select', toPayload(asset));
  }
  onClose();
};

const onUrlSelect = (data: { url: string; title?: string }) => {
  emit('select', data);
  onClose();
};

// Fresh tab content on each dialog open
watch(
  () => props.modelValue,
  (open) => {
    if (open) sessionKey.value++;
  },
);
</script>
