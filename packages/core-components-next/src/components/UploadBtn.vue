<template>
  <template v-if="fileName">
    <VBtn
      v-if="isEditing"
      color="red"
      icon="mdi-delete"
      @click="emit('delete')"
    />
    <VTextField
      v-if="fileName"
      :model-value="fileName"
      hide-details="auto"
      min-width="350"
      variant="outlined"
      disabled
    />
  </template>
  <template v-else-if="isEditing">
    <input
      :id="id"
      :key="fileName"
      ref="fileInput"
      :accept="extensions.join(', ')"
      class="d-none"
      type="file"
      @change="validateAndUpload($event.target as HTMLInputElement)"
    />
    <VBtn
      v-if="fileInput"
      :loading="uploading"
      color="grey-darken-4"
      @click="fileInput.click()"
    >
      <VIcon color="secondary" icon="mdi-cloud-upload-outline" start />
      {{ props.label }}
    </VBtn>
  </template>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';
import uniqueId from 'lodash/uniqueId';

import { useUpload } from '../composables/useUpload';

interface Props {
  isEditing: boolean;
  id?: string;
  fileName?: string;
  fileKey?: string;
  label?: string;
  extensions: string[];
}

const props = withDefaults(defineProps<Props>(), {
  id: uniqueId('file_'),
  fileName: '',
  fileKey: '',
  validate: () => ({ ext: [] }),
  label: 'Choose a file',
});

const emit = defineEmits(['upload', 'delete', 'update:uploading']);

const fileInput = ref<HTMLInputElement>();

const { upload, uploading } = useUpload(emit);

const validateAndUpload = async (target: HTMLInputElement) => {
  const files = Array.from(target.files ?? []);
  const regex = new RegExp('.(' + props.extensions.join('|') + ')$', 'i');
  const isValid = files.every((file: File) => regex.test(file.name));
  if (isValid) return upload(files[0]);
};

watch(uploading, (val) => emit('update:uploading', val));
</script>
