<template>
  <MessageComposer
    v-model="draft"
    class="message-editor"
    placeholder="Edit your message..."
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
      @click="save(draft)"
    />
  </div>
</template>

<script lang="ts" setup>
import { MessageComposer } from '@tailor-cms/core-components';

const props = defineProps<{ content?: string | null }>();

const emit = defineEmits<{ save: [content: string]; cancel: [] }>();

const draft = ref(props.content ?? '');

const save = (value: string) => {
  const content = value.trim();
  if (!content || content === props.content) return emit('cancel');
  emit('save', content);
};
</script>
