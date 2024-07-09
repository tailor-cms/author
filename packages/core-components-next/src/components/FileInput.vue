<template>
  <form @submit.prevent>
    <VFileInput
      v-if="!fileKey"
      :accept="acceptedFileTypes"
      :density="density"
      :label="label"
      :loading="uploading ? 'primary' : false"
      :placeholder="placeholder"
      :prepend-inner-icon="icon"
      :variant="variant"
      prepend-icon=""
      @update:model-value="upload"
    />
    <div v-else class="mb-5 text-left">
      <div class="ma-1 text-body-2">{{ label }}</div>
      <VSheet
        class="d-flex align-center"
        max-width="460"
        rounded="lg"
        variant="tonal"
      >
        <div class="d-flex align-center">
          <VAvatar class="mr-3" color="primary" rounded="s-lg e-sm" size="75">
            <VImg v-if="image" :src="image" rounded="s-lg e-0" />
            <VIcon v-else :icon="icon" size="x-large" />
          </VAvatar>
          <div class="file-name">
            {{ fileName }}
          </div>
        </div>
        <VSpacer />
        <div class="d-flex ma-3">
          <VBtn
            class="ml-2"
            color="primary"
            icon="mdi-download"
            size="small"
            variant="tonal"
            @click="downloadFile(fileKey, fileName)"
          />
          <VBtn
            class="ml-1"
            color="secondary"
            icon="mdi-trash-can-outline"
            size="small"
            variant="tonal"
            @click.stop="deleteFile({ id, fileName })"
          />
        </div>
      </VSheet>
    </div>
  </form>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { type VFileInput } from 'vuetify/components';

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
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'outlined',
  density: 'default',
  icon: 'mdi-file',
  value: () => ({}),
});
const emit = defineEmits(['upload', 'delete']);

const { upload, deleteFile, downloadFile, uploading } = useUpload(emit);

const image = computed(() => props.value?.publicUrl);
const acceptedFileTypes = computed(() => {
  const ext = props.validate.ext;
  return ext?.length ? `.${ext.join(',.')}` : '';
});
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
</style>
