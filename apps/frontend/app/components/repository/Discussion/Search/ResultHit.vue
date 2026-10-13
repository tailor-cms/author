<template>
  <VListItem class="result-hit px-4 py-2" rounded="lg">
    <div class="result-hit-row">
      <SenderAvatar :message="hit" :size="36" />
      <div class="result-hit-content">
        <MessageHeader :message="hit" has-relative-time />
        <MessageBody
          :content="hit.content"
          :current-user-id="currentUserId"
          class="result-hit-body text-body-large"
        />
      </div>
    </div>
  </VListItem>
</template>

<script lang="ts" setup>
import type { MessageSearchHit } from '@tailor-cms/api-client';

import { MessageBody } from '@tailor-cms/core-components';
import MessageHeader from '../MessageHeader.vue';
import SenderAvatar from '../SenderAvatar.vue';

// A matching message, laid out like it is in the thread
defineProps<{
  hit: MessageSearchHit;
  currentUserId?: number | null;
}>();
</script>

<style lang="scss" scoped>
.result-hit-row {
  display: grid;
  grid-template-columns: 3rem 1fr;
  align-items: start;
}

.result-hit-content {
  min-width: 0;
  max-width: 46rem;
}

.result-hit-body {
  display: -webkit-box;
  overflow: hidden;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}
</style>
