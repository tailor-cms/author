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
  submit: [data: { url: string; title?: string }];
}>();

const url = ref('');
const title = ref('');
const error = ref('');

const submit = () => {
  const value = url.value.trim();
  if (!value || !URL.canParse(value)) {
    error.value = 'Please enter a valid URL';
    return;
  }
  error.value = '';
  emit('submit', {
    url: value,
    title: title.value.trim() || undefined,
  });
};

defineExpose({ submit });
</script>

<style lang="scss" scoped>
.url-tab {
  padding: 1rem;
}
</style>
