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
    <span v-tooltip:top="fullTime" class="text-body-small text-medium-emphasis">
      {{ hasRelativeTime ? timeAgo : shortTime }}
    </span>
  </div>
</template>

<script lang="ts" setup>
import type { Message } from '@tailor-cms/interfaces/comment';

import { useDateFormat, useTimeAgo } from '@vueuse/core';
import { senderName } from './utils';

const props = defineProps<{
  message: Pick<
    Message,
    'author' | 'senderName' | 'integration' | 'createdAt'
  >;
  hasRelativeTime?: boolean;
}>();

const postedAt = () => props.message.createdAt;
const shortTime = useDateFormat(postedAt, 'HH:mm');
const dateTime = useDateFormat(postedAt, 'DD MMM YYYY HH:mm');
const timeAgo = useTimeAgo(postedAt);
const fullTime = computed(() => `${dateTime.value} · ${timeAgo.value}`);
</script>

<style lang="scss" scoped>
.message-header-sender {
  color: rgb(var(--v-theme-on-surface));
  line-height: 1.25rem;

  .v-theme--dark & {
    color: #edf1f7;
  }
}

.integration-badge {
  letter-spacing: 0.06em;
}
</style>
