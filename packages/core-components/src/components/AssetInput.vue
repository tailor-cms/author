<template>
  <VToolbarItems class="ga-2">
    <VBtn
      v-if="url && !isEditing"
      :href="publicUrl || url"
      color="info"
      icon="mdi-open-in-new"
      target="_blank"
      variant="text"
    />
    <UploadBtn
      v-if="allowFileUpload"
      :extensions="extensions"
      :file-name="fileName"
      :is-editing="isEditing"
      :label="props.uploadLabel"
      @delete="file = null"
      @update:uploading="uploading = $event"
      @upload="uploadFile"
    />
    <template v-if="!uploading && (urlInput || !hasAsset)">
      <VTextField
        :disabled="!isEditing"
        :error-messages="errors.url"
        :model-value="urlInput"
        :placeholder="allowFileUpload ? 'or paste a URL...' : 'Paste a URL...'"
        hide-details="auto"
        min-width="350"
        variant="outlined"
        clearable
        @update:model-value="urlInput = $event || null"
      />
    </template>
    <VBtn v-if="!isEditing" @click="isEditing = true">Edit</VBtn>
    <template v-else>
      <VBtn v-if="hasChanges" :disabled="uploading" @click="save">Save</VBtn>
      <VBtn v-if="hasChanges || url" :disabled="uploading" @click="cancel">
        Cancel
      </VBtn>
    </template>
  </VToolbarItems>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { object, string } from 'yup';
import last from 'lodash/last';
import pick from 'lodash/pick';
import { useForm } from 'vee-validate';

import UploadBtn from './UploadBtn.vue';

const isUploaded = (url: string | null) => {
  try {
    return url && new URL(url).protocol === 'storage:';
  } catch (e) {
    return false;
  }
};

interface Props {
  extensions: string[];
  url?: string | null;
  publicUrl?: string | null;
  allowFileUpload?: boolean;
  uploadLabel?: string;
}

const props = withDefaults(defineProps<Props>(), {
  url: null,
  publicUrl: null,
  allowFileUpload: true,
  uploadLabel: 'Select file',
});
const emit = defineEmits(['input']);

const uploading = ref(false);
const isEditing = ref(!props.url);
const file = ref(
  isUploaded(props.url) ? pick(props, ['url', 'publicUrl']) : null,
);

const { defineField, errors, validate } = useForm({
  validationSchema: object({
    url: string().url().nullable(),
  }),
  initialValues: { url: !isUploaded(props.url) ? props.url : null },
});

const [urlInput] = defineField('url');

const hasAsset = computed(() => file.value || urlInput.value);
const hasChanges = computed(
  () => props.url !== (urlInput.value || file.value?.url || null),
);

const fileName = computed(() => {
  if (!file.value || !file.value.url) return;
  return last(file.value.url.split('___'));
});

const uploadFile = (value: any) => {
  file.value = value;
  urlInput.value = null;
};

const save = async () => {
  const { valid } = await validate();
  if (!valid) return;
  isEditing.value = false;
  const payload = file.value || {
    url: urlInput.value,
    publicUrl: urlInput.value,
  };
  emit('input', payload);
};

const cancel = () => {
  const isLinked = !isUploaded(props.url);
  urlInput.value = isLinked ? props.url : null;
  file.value = isLinked ? null : pick(props, ['url', 'publicUrl']);
  isEditing.value = !props.url;
};
</script>
