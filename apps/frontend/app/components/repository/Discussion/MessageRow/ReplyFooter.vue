<template>
  <VBtn
    class="reply-footer px-2"
    color="primary"
    rounded="lg"
    size="small"
    variant="text"
    @click="emit('open')"
  >
    <span v-if="repliers.length" class="d-flex mr-2">
      <UserAvatar
        v-for="replier in repliers"
        :key="replier.id"
        :img-url="replier.imgUrl"
        :size="20"
        class="reply-footer-avatar"
      />
    </span>
    <VIcon v-else class="mr-2" icon="mdi-chat-outline" size="16" />
    <span class="text-body-small font-weight-bold">
      {{ pluralize('reply', count, true) }}
    </span>
    <span
      v-if="message.lastReplyAt"
      class="text-body-small text-medium-emphasis ml-2"
    >
      {{ lastReplyAgo }}
    </span>
  </VBtn>
</template>

<script lang="ts" setup>
import type { Message } from '@tailor-cms/interfaces/comment';

import { UserAvatar } from '@tailor-cms/core-components';
import { useTimeAgo } from '@vueuse/core';
import { useCurrentRepository } from '@/stores/current-repository';
import pluralize from 'pluralize-esm';

const props = defineProps<{ message: Message }>();

const emit = defineEmits<{ open: [] }>();

const REPLIER_LIMIT = 5;

const repoStore = useCurrentRepository();

const count = computed(() => props.message.replyCount ?? 0);

const repliers = computed(() =>
  (props.message.replyAuthorIds ?? [])
    .slice(0, REPLIER_LIMIT)
    .map((id) => repoStore.$users.get(String(id)))
    .filter((it) => !!it),
);

const lastReplyAgo = useTimeAgo(() => props.message.lastReplyAt ?? '');
</script>

<style lang="scss" scoped>
.reply-footer-avatar {
  box-shadow: 0 0 0 0.125rem rgb(var(--v-theme-surface));

  & + & {
    margin-left: -0.375rem;
  }
}
</style>
