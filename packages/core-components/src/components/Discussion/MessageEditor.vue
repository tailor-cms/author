<template>
  <div class="message-editor">
    <MessageComposer
      ref="composerEl"
      v-model="draft"
      :placeholder="placeholder"
      autofocus
      is-editing
      @submit="save"
    />
    <div class="d-flex ga-2 mt-2">
      <VBtn size="small" text="Cancel" variant="text" @click="emit('cancel')" />
      <VBtn
        color="primary"
        size="small"
        text="Save"
        variant="flat"
        @click="submit"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';

import MessageComposer from './MessageComposer/index.vue';

// Edits a posted message in place. Nothing to save, or nothing changed,
// just closes the editor
const props = withDefaults(
  defineProps<{ content?: string | null; placeholder?: string }>(),
  { content: '', placeholder: 'Edit your message...' },
);

const emit = defineEmits<{ save: [content: string]; cancel: [] }>();

const composerEl = ref<InstanceType<typeof MessageComposer>>();
const draft = ref(props.content ?? '');

const save = (value: string) => {
  const content = value.trim();
  if (!content || content === props.content) return emit('cancel');
const save = (content: string) => {
  if (content === props.content) return emit('cancel');
  emit('save', content);
};
</script>
