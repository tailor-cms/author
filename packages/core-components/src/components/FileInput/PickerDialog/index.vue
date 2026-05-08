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
            v-if="allowUrlSource"
            value="url"
            class="ml-2"
            color="primary-lighten-5"
          >
            <VIcon class="mr-2" size="small">mdi-link-variant</VIcon>
            URL
          </VTab>
        </VTabs>
      </div>
      <VTabsWindow :key="sessionKey" v-model="activeTab">
        <VTabsWindowItem value="upload">
          <UploadTab :accept="accept" @select="onFileSelect" />
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
          Submit
        </VBtn>
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
}

const props = withDefaults(defineProps<Props>(), {
  heading: 'Add file',
  icon: 'mdi-file',
  accept: '',
  allowedExtensions: () => [],
  allowUrlSource: false,
  multiple: false,
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

// Fresh tab content on each dialog open
watch(
  () => props.modelValue,
  (open) => {
    if (open) sessionKey.value++;
  },
);
</script>
