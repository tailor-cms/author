<template>
  <UserAvatar
    v-if="message.author"
    :img-url="message.author.imgUrl"
    :size="size"
  />
  <IntegrationAvatar
    v-else
    :emoji="message.senderEmoji"
    :integration="message.integration"
    :size="size"
  />
</template>

<script lang="ts" setup>
import type { Message } from '@tailor-cms/interfaces/comment';

import { UserAvatar } from '@tailor-cms/core-components';
import IntegrationAvatar from './IntegrationAvatar.vue';

defineProps<{
  message: Pick<Message, 'author' | 'integration' | 'senderEmoji'>;
  size: number;
}>();
</script>
