<template>
  <VBtn
    class="reply-footer pl-1 pr-2"
    color="secondary"
    max-width="100%"
    rounded="lg"
    size="small"
    spaced="end"
    variant="text"
    width="22rem"
    border
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
    <span class="text-body-small font-weight-semibold">
      {{ pluralize('reply', count, true) }}
    </span>
    <span
      v-if="message.lastReplyAt"
      class="reply-footer-hint text-body-small text-medium-emphasis ml-2"
    >
      {{ lastReplyLabel }}
    </span>
    <VSpacer />
    <VIcon
      class="reply-footer-hint ml-2"
      color="text-medium-emphasis"
      icon="mdi-chevron-right"
      size="small"
    />
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

// With a single reply, "last" says nothing
const lastReplyLabel = computed(() =>
  count.value > 1 ? `Last reply ${lastReplyAgo.value}` : lastReplyAgo.value,
);
</script>

<style lang="scss" scoped>
.reply-footer {
  border-color: transparent;
  transition: border-color 0.15s ease;

  &:hover,
  &:focus-visible {
    border-color: rgba(var(--v-border-color), var(--v-border-opacity));

    .reply-footer-hint {
      opacity: 1;
    }
  }
}

.reply-footer-hint {
  opacity: 0;
  transition: opacity 0.15s ease;
}

.reply-footer-avatar {
  box-shadow: 0 0 0 0.125rem rgb(var(--v-theme-surface-raised));

  & + & {
    margin-left: -0.375rem;
  }
}
</style>
