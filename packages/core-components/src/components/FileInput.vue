<template>
  <VFileInput
    v-if="!fileKey"
    :accept="acceptedFileTypes"
    :density="density"
    :label="placeholder || label"
    :loading="uploading ? 'primary' : false"
    :prepend-inner-icon="icon"
    :variant="variant"
    prepend-icon=""
    @update:model-value="upload"
  />
  <div v-else class="mb-5 text-left">
    <div class="v-label ma-1 text-caption">{{ label }}</div>
    <VOverlay
      v-model="expanded"
      :class="{ expanded }"
      content-class="d-flex align-center justify-center h-100 w-100"
      close-on-content-click
    >
      <template #activator="{ props: dialogProps }">
        <VCard
          v-bind="showPreview ? dialogProps : {}"
          :color="dark ? 'primary-lighten-4' : 'primary'"
          class="d-flex align-center mb-9"
          max-width="460"
          rounded="lg"
          variant="tonal"
          border
        >
          <div class="d-flex align-center">
            <VAvatar class="mr-3" color="primary" rounded="s-lg e-sm" size="75">
              <VProgressCircular v-if="isLoading" indeterminate />
              <VImg
                v-else-if="showPreview"
                :src="publicUrl || value.publicUrl"
                rounded="s-lg e-0"
              />
              <VIcon v-else :icon="icon" size="x-large" />
            </VAvatar>
            <div
              :class="`text-primary-${dark ? 'lighten-3' : 'darken-2'}`"
              class="file-name"
            >
              {{ fileName }}
            </div>
          </div>
          <VSpacer />
          <div class="d-flex ma-3">
            <VBtn
              :color="dark ? 'primary-lighten-3' : 'primary-lighten-1'"
              class="ml-2"
              icon="mdi-download"
              size="small"
              variant="tonal"
              @click="downloadFile(fileKey, fileName)"
            />
            <VBtn
              :color="dark ? 'secondary-lighten-3' : 'secondary-lighten-1'"
              class="ml-1"
              icon="mdi-trash-can-outline"
              size="small"
              variant="tonal"
              @click.stop="deleteFile({ id, fileName })"
            />
          </div>
        </VCard>
      </template>
      <VBtn
        class="position-absolute top-0 right-0 ma-4"
        color="white"
        icon="mdi-close"
        variant="tonal"
        @click="expanded = false"
      />
      <img :src="publicUrl || value.publicUrl" alt="Full image" />
    </VOverlay>
  </div>
</template>

<script lang="ts" setup>
import { computed, inject, ref, watch } from 'vue';
import type { VFileInput } from 'vuetify/components';

import { useUpload } from '../composables/useUpload';

interface Props {
  id: string;
  fileKey: string;
  fileName: string;
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

const acceptedFileTypes = computed(() => {
  const ext = props.validate.ext;
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
.file-name {
  font-size: 1rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  word-wrap: break-word;
  word-break: break-all;
}

.v-overlay {
  transition: all 0.3s ease;

  &.expanded {
    backdrop-filter: blur(18px);
  }

  :deep(img) {
    max-width: 100%;
  }
}

.v-label {
  opacity: 0.65;
}
</style>
