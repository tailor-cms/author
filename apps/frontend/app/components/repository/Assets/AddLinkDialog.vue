<template>
  <TailorDialog v-model="show" header-icon="mdi-link-plus" width="480">
    <template #header>Add Link</template>
    <template #body>
      <VTextField
        v-model="url"
        :error-messages="urlError"
        color="primary-darken-4"
        density="comfortable"
        hide-details="auto"
        label="URL"
        placeholder="https://example.com"
        prepend-inner-icon="mdi-link"
        variant="outlined"
        @keyup.enter="submit"
      />
    </template>
    <template #actions>
      <VBtn
        color="primary-darken-4"
        variant="text"
        @click="show = false"
      >
        Cancel
      </VBtn>
      <VBtn
        :disabled="!isValid"
        color="primary-darken-2"
        variant="tonal"
        @click="submit"
      >
        Add
      </VBtn>
    </template>
  </TailorDialog>
</template>

<script lang="ts" setup>
import { TailorDialog } from '@tailor-cms/core-components';

const show = defineModel<boolean>({ default: false });
const emit = defineEmits(['created']);

const url = ref('');
const urlError = ref('');

const isValid = computed(() => {
  try {
    new URL(url.value);
    return true;
  } catch {
    return false;
  }
});

watch(show, (v) => {
  if (!v) return;
  url.value = '';
  urlError.value = '';
});

function submit() {
  if (!isValid.value) {
    urlError.value = 'Please enter a valid URL';
    return;
  }
  emit('created', url.value);
  show.value = false;
}
</script>
