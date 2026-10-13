<template>
  <div class="url-tab">
    <VTextField
      v-model="url"
      :error-messages="error"
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
      label="Title (optional)"
      variant="outlined"
      hide-details
    />
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';

const emit = defineEmits<{
  submit: [data: { url: string; name?: string }];
}>();

const url = ref('');
const title = ref('');
const error = ref('');

// File name from a URL's last path segment, without query or hash
const fileNameFromUrl = (value: string) => {
  try {
    const segment = new URL(value).pathname.split('/').pop();
    return segment ? decodeURIComponent(segment) : undefined;
  } catch {
    return undefined;
  }
};

const submit = () => {
  const value = url.value.trim();
  if (!value || !URL.canParse(value)) {
    error.value = 'Please enter a valid URL';
    return;
  }
  error.value = '';
  // Same `name` key as uploads and library picks; the title is optional
  emit('submit', {
    url: value,
    name: title.value.trim() || fileNameFromUrl(value),
  });
};

defineExpose({ submit });
</script>

<style lang="scss" scoped>
.url-tab {
  padding: 1rem;
}
</style>
