<template>
  <div class="start-discussion d-flex flex-column justify-center pa-8">
    <div class="panel mx-auto w-100">
      <div class="text-center mb-6">
        <VAvatar color="primary" size="56" variant="tonal">
          <VIcon icon="mdi-forum-outline" size="28" />
        </VAvatar>
        <h2 class="text-title-medium font-weight-bold mt-4">
          Start a thread
        </h2>
        <p class="text-body-medium text-medium-emphasis mt-2">
          Ask a question, share context, or flag something for the team.
          Mention people with <strong>@</strong> and link activities,
          elements or assets with <strong>#</strong>.
        </p>
      </div>
      <VTextField
        ref="titleEl"
        v-model="title"
        :error-messages="error"
        class="mb-3"
        density="comfortable"
        placeholder="Subject"
        prepend-inner-icon="mdi-format-title"
        rounded="lg"
        variant="solo-filled"
        autofocus
        flat
        @update:model-value="error = ''"
      />
      <MessageComposer
        placeholder="What would you like to discuss?"
        @submit="submit"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { MessageComposer } from '@tailor-cms/core-components';

const emit = defineEmits<{
  create: [payload: { content: string; title: string }];
}>();

const title = ref('');
const titleEl = ref<any>(null);
const error = ref('');

const submit = (content: string) => {
  const subject = title.value.trim();
  if (!subject) {
    error.value = 'Give the thread a subject';
    titleEl.value?.focus();
    return;
  }
  emit('create', { content, title: subject });
  title.value = '';
  error.value = '';
};
</script>

<style lang="scss" scoped>
.panel {
  max-width: 40rem;
}
</style>
