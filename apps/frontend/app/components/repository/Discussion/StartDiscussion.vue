<template>
  <div class="start-discussion d-flex flex-column justify-center pa-8">
    <div class="panel mx-auto w-100">
      <div class="text-center mb-8">
        <VAvatar color="secondary" size="64" variant="tonal">
          <VIcon icon="mdi-forum-outline" size="x-large" />
        </VAvatar>
        <h2 class="text-title-large font-weight-semibold mt-4">
          Start a thread
        </h2>
        <p
          class="text-body-medium text-medium-emphasis mt-2"
          :style="{ maxWidth: '32rem', margin: '0.5rem auto' }"
        >
          Ask a question, share context, or flag something for the team.
          Mention people with <strong>@</strong> and link activities,
          elements or assets with <strong>#</strong>.
        </p>
      </div>
      <VTextField
        v-model="title"
        :counter="THREAD_TITLE_MAX_LENGTH"
        :error-messages="titleError"
        class="mb-3"
        density="comfortable"
        placeholder="Subject"
        prepend-inner-icon="mdi-format-title"
        rounded="lg"
        autofocus
        flat
      />
      <MessageComposer
        v-model="draft"
        :is-submit-disabled="!isTitleValid"
        placeholder="What would you like to discuss?"
        @submit="submit"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { MessageComposer } from '@tailor-cms/core-components';
import { THREAD_TITLE_MAX_LENGTH } from '@tailor-cms/interfaces/comment';

const emit = defineEmits<{
  create: [payload: { content: string; title: string }];
}>();

const title = ref('');
const draft = ref('');

const isTitleTooLong = computed(
  () => title.value.trim().length > THREAD_TITLE_MAX_LENGTH,
);
const isTitleValid = computed(
  () => !!title.value.trim() && !isTitleTooLong.value,
);
const titleError = computed(() =>
  isTitleTooLong.value
    ? `Use ${THREAD_TITLE_MAX_LENGTH} characters or fewer`
    : '',
);

const submit = (content: string) => {
  emit('create', { content, title: title.value.trim() });
  title.value = '';
};
</script>

<style lang="scss" scoped>
.panel {
  max-width: 40rem;
}
</style>
