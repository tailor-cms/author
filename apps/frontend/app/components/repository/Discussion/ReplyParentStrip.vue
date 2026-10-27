<template>
  <VListItem
    class="reply-parent-strip border-b px-5"
    density="compact"
    @click="emit('jump:parent')"
  >
    <template #prepend>
      <SenderAvatar :message="message" :size="24" />
    </template>
    <VListItemTitle class="text-body-medium">
      <span class="font-weight-bold">{{ senderName(message) }}</span>
      <span class="text-medium-emphasis ml-2">{{ excerpt }}</span>
    </VListItemTitle>
  </VListItem>
</template>

<script lang="ts" setup>
import type { Message } from '@tailor-cms/interfaces/comment';

import { toPlainText } from '@tailor-cms/utils';
import SenderAvatar from './SenderAvatar.vue';
import { senderName } from './utils';

const props = defineProps<{ message: Message }>();

const emit = defineEmits<{ 'jump:parent': [] }>();

const excerpt = computed(() =>
  props.message.deletedAt
    ? 'This message was deleted.'
    : toPlainText(props.message.content),
);
</script>

<style lang="scss" scoped>
.reply-parent-strip {
  background: rgb(var(--v-theme-surface-sidebar));
}
</style>
