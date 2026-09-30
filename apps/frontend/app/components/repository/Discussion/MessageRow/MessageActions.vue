<template>
  <VSheet
    class="message-actions d-flex align-center px-1"
    color="surface-container-high"
    elevation="2"
    rounded="lg"
    border
  >
    <EmojiPicker v-if="isReactable" @select="emit('react', $event)">
      <template #activator="{ props: picker }">
        <VBtn
          v-tooltip:top="'Add reaction'"
          v-bind="picker"
          aria-label="Add reaction"
          icon="mdi-emoticon-plus-outline"
          size="small"
          variant="text"
        />
      </template>
    </EmojiPicker>
    <VBtn
      v-if="isReplyable"
      v-tooltip:top="'Reply in thread'"
      aria-label="Reply in thread"
      icon="mdi-chat-outline"
      size="small"
      variant="text"
      @click="emit('reply')"
    />
    <VMenu v-if="isAuthor" location="bottom end">
      <template #activator="{ props: menu }">
        <VBtn
          v-tooltip:top="'More actions'"
          v-bind="menu"
          aria-label="More actions"
          icon="mdi-dots-horizontal"
          size="small"
          variant="text"
        />
      </template>
      <VList density="compact" min-width="180" nav>
        <VListItem
          prepend-icon="mdi-square-edit-outline"
          rounded="lg"
          title="Edit message"
          @click="emit('edit')"
        />
        <VListItem
          base-color="error"
          prepend-icon="mdi-trash-can-outline"
          rounded="lg"
          title="Delete message"
          @click="emit('remove')"
        />
      </VList>
    </VMenu>
  </VSheet>
</template>

<script lang="ts" setup>
import { EmojiPicker } from '@tailor-cms/core-components';

defineProps<{
  isReactable?: boolean;
  isReplyable?: boolean;
  isAuthor?: boolean;
}>();

const emit = defineEmits<{
  remove: [];
  reply: [];
  edit: [];
  react: [emoji: string];
}>();
</script>
