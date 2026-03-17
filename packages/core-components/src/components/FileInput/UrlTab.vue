<template>
  <div class="pa-6">
    <VTextField
      v-model="url"
      :error-messages="error"
      color="primary-darken-2"
      density="comfortable"
      hide-details="auto"
      label="File URL"
      placeholder="https://example.com/file.pdf"
      prepend-inner-icon="mdi-link-variant"
      variant="outlined"
      @keydown.enter="submit"
    />
    <div class="mt-2 text-caption text-primary">
      Enter a direct link to a file
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';

const emit = defineEmits(['import']);

const url = ref('');
const error = ref('');

const submit = () => {
  if (!url.value) return;
  try {
    new URL(url.value);
  } catch {
    error.value = 'Please enter a valid URL';
    return;
  }
  error.value = '';
  emit('import', url.value.trim());
};

const reset = () => {
  url.value = '';
  error.value = '';
};

defineExpose({ submit, reset });
</script>
