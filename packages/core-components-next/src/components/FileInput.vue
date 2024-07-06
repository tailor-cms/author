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
      <VChip
        :prepend-icon="icon"
        class="pr-2"
        color="primary"
        size="large"
        variant="tonal"
      >
        {{ truncate(fileName, { length: 35 }) }}
        <template #append>
          <VBtn
            class="ml-2"
            color="primary"
            icon="mdi-download"
            size="26"
            variant="text"
            @click="downloadFile(fileKey, fileName)"
          />
          <VBtn
            class="ml-1"
            color="secondary-lighten-2"
            icon="mdi-trash-can-outline"
            size="26"
            variant="text"
            @click.stop="deleteFile({ id, fileName })"
          />
        </template>
      </VChip>
    </div>
  </form>
</template>

<script lang="ts" setup>
import { computed, defineProps } from 'vue';
import truncate from 'lodash/truncate';
import { type VFileInput } from 'vuetify/components';

import { useUpload } from '../composables/useUpload';

interface Props {
  id: string;
  fileKey: string;
  fileName: string;
  validate: Record<string, any>;
  label: string;
  placeholder: string;
  icon?: string;
  variant?: VFileInput['variant'];
  density?: VFileInput['density'];
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'outlined',
  density: 'default',
  icon: 'mdi-file',
});

const { upload, deleteFile, downloadFile, uploading } = useUpload();

const acceptedFileTypes = computed(() => {
  const ext = props.validate.ext;
  return ext?.length ? `.${ext.join(',.')}` : '';
});
</script>
