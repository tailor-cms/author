<template>
  <div class="message-header d-flex align-baseline ga-2">
    <span class="message-header-sender text-body-large font-weight-medium">
      {{ senderName(message) }}
    </span>
    <VChip
      v-if="message.integration"
      class="integration-badge align-self-center"
      density="compact"
      rounded="pill"
      size="x-small"
      text="BOT"
      variant="tonal"
    />
    <MessageTime
      :at="message.createdAt"
      :is-relative="hasRelativeTime"
      class="text-body-small text-medium-emphasis"
    />
  </div>
</template>

<script lang="ts" setup>
import type { Message } from '@tailor-cms/interfaces/comment';

import { MessageTime } from '@tailor-cms/core-components';
import { senderName } from './utils';

defineProps<{
  message: Pick<
    Message,
    'author' | 'senderName' | 'integration' | 'createdAt'
  >;
  hasRelativeTime?: boolean;
}>();
</script>

<style lang="scss" scoped>
.message-header-sender {
  color: rgb(var(--v-theme-on-surface));
  line-height: 1.25rem;
}

.integration-badge {
  letter-spacing: 0.06em;
}
</style>
