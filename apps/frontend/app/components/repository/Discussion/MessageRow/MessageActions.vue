<template>
  <VSheet
    class="message-actions d-flex align-center"
    color="surface-overlay"
    elevation="2"
    rounded="lg"
    border
  >
    <AddReactionButton
      v-if="isReactable"
      density="comfortable"
      size="small"
      rounded="lg"
      @select="emit('react', $event)"
    />
    <VBtn
      v-if="isReplyable"
      v-tooltip:top="'Reply in thread'"
      aria-label="Reply in thread"
      density="comfortable"
      icon="mdi-chat-outline"
      size="small"
      variant="text"
      rounded="lg"
      @click="emit('reply')"
    />
    <VMenu v-if="isAuthor" location="bottom end">
      <template #activator="{ props: menu }">
        <VBtn
          v-tooltip:top="'More actions'"
          v-bind="menu"
          aria-label="More actions"
          density="comfortable"
          icon="mdi-dots-horizontal"
          size="small"
          variant="text"
          rounded="lg"
        />
      </template>
      <VList density="compact" min-width="180" nav>
        <VListItem
          v-if="isBroadcastable"
          :prepend-icon="
            isBroadcast
              ? 'mdi-message-minus-outline'
              : 'mdi-message-arrow-right-outline'
          "
          :title="isBroadcast ? 'Remove from thread' : 'Send to thread'"
          @click="emit('set:broadcast', !isBroadcast)"
        />
        <VListItem
          prepend-icon="mdi-square-edit-outline"
          title="Edit message"
          @click="emit('edit')"
        />
        <VListItem
          base-color="error"
          prepend-icon="mdi-trash-can-outline"
          title="Delete message"
          @click="emit('remove')"
        />
      </VList>
    </VMenu>
  </VSheet>
</template>

<script lang="ts" setup>
import { AddReactionButton } from '@tailor-cms/core-components';

defineProps<{
  isReactable?: boolean;
  isReplyable?: boolean;
  isAuthor?: boolean;
  // An own reply, which can go in or out of the thread
  isBroadcastable?: boolean;
  // Also shown in the thread
  isBroadcast?: boolean;
}>();

const emit = defineEmits<{
  'remove': [];
  'reply': [];
  'edit': [];
  'react': [emoji: string];
  'set:broadcast': [isBroadcast: boolean];
}>();
</script>

<style lang="scss" scoped>
.message-actions {
  padding: 0.125rem;
  gap: 0.125rem;
}
</style>
