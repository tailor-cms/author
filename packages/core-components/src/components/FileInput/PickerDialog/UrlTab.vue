<template>
  <div class="url-tab">
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
    <VTextField
      v-model="title"
      class="mt-3"
      color="primary-darken-2"
      density="comfortable"
      label="Title (optional)"
      variant="outlined"
      hide-details
    />
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';

const emit = defineEmits<{
  submit: [data: { url: string; title?: string }];
}>();

const url = ref('');
const title = ref('');
const error = ref('');

const submit = () => {
  if (!url.value) return;
  if (!URL.canParse(url.value)) {
    error.value = 'Please enter a valid URL';
    return;
  }
  error.value = '';
  emit('submit', {
    url: url.value.trim(),
    title: title.value.trim() || undefined,
  });
};

defineExpose({ submit });
</script>

<style lang="scss" scoped>
.url-tab {
  padding: 2rem;
}
</style>
