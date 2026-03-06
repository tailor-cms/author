<template>
  <VFileInput
    v-if="!fileKey"
    v-bind="$attrs"
    :accept="acceptedFileTypes"
    :clearable="false"
    :density="density"
    :label="label"
    :loading="uploading"
    :placeholder="placeholder"
    :prepend-inner-icon="icon"
    :variant="variant"
    prepend-icon=""
    @update:model-value="upload"
  />
  <VOverlay
    v-else
    v-model="expanded"
    :class="{ expanded }"
    content-class="d-flex align-center justify-center h-100 w-100"
    close-on-content-click
  >
    <template #activator="{ props: dialogProps }">
      <VTextField
        v-bind="$attrs"
        :density="density"
        :label="label"
        :model-value="fileName"
        :variant="variant"
        readonly
      >
        <template #prepend-inner>
          <VProgressCircular v-if="isLoading" indeterminate size="24" />
          <VImg
            v-else-if="showPreview && imageUrl"
            :src="imageUrl"
            height="24"
            width="24"
            cover
          />
          <VIcon v-else :icon="icon" />
        </template>
        <template #append-inner>
          <VBtn
            v-if="showPreview"
            v-bind="dialogProps"
            :color="dark ? 'white' : 'primary'"
            class="mr-1"
            size="x-small"
            variant="tonal"
            icon
          >
            <VIcon icon="mdi-magnify" size="large" />
          </VBtn>
          <VBtn
            :color="dark ? 'white' : 'primary'"
            class="mr-1"
            size="x-small"
            variant="tonal"
            icon
            @click="downloadFile(fileKey, fileName)"
          >
            <VIcon icon="mdi-download" size="large" />
          </VBtn>
          <VBtn
            :color="dark ? 'secondary-lighten-3' : 'secondary'"
            size="x-small"
            variant="tonal"
            icon
            @click.stop="deleteFile({ id, fileName })"
          >
            <VIcon icon="mdi-trash-can-outline" size="large" />
          </VBtn>
        </template>
      </VTextField>
    </template>
    <VBtn
      class="position-absolute top-0 right-0 ma-4"
      color="white"
      icon="mdi-close"
      variant="tonal"
      @click="expanded = false"
    />
    <img :src="imageUrl" alt="Full image" />
  </VOverlay>
</template>

<script lang="ts" setup>
import { computed, inject, ref, watch } from 'vue';
import type { VFileInput } from 'vuetify/components';

import { useUpload } from '../composables/useUpload';

interface Props {
  id: string;
  fileKey: string;
  fileName: string;
  ext?: string[];
  validate: Record<string, any>;
  label: string;
  placeholder: string;
  value?: Record<string, any>;
  icon?: string;
  variant?: VFileInput['variant'];
  density?: VFileInput['density'];
  dark?: boolean;
  showPreview?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'outlined',
  density: 'default',
  icon: 'mdi-file',
  dark: false,
  showPreview: false,
  value: () => ({}),
});
const emit = defineEmits(['upload', 'delete']);

const storageService = inject<any>('$storageService');
const { upload, deleteFile, downloadFile, uploading } = useUpload(emit);

const expanded = ref(false);
const isLoading = ref(false);
const publicUrl = ref('');

const imageUrl = computed(() => publicUrl.value || props.value?.publicUrl || '');

const acceptedFileTypes = computed(() => {
  const ext = props.ext || props.validate?.ext;
  return ext?.length ? `.${ext.join(',.')}` : '';
});

watch(
  () => props.fileKey,
  async (key) => {
    if (!props.showPreview) return;
    isLoading.value = true;
    publicUrl.value = key ? await storageService.getUrl(key) : '';
    isLoading.value = false;
  },
  { immediate: true },
);
</script>

<style lang="scss" scoped>
.v-overlay {
  transition: all 0.3s ease;

  &.expanded {
    backdrop-filter: blur(18px);
  }

  :deep(img) {
    max-width: 100%;
    max-height: 100%;
  }
}
</style>
