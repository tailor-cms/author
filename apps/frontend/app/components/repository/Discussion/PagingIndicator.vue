<template>
  <div v-if="status !== PagingStatus.Empty" class="d-flex justify-center py-4">
    <VBtn
      v-if="status === PagingStatus.Error"
      :text="`Retry loading ${label}`"
      prepend-icon="mdi-refresh"
      size="small"
      variant="text"
      @click="emit('retry')"
    />
    <VProgressCircular v-else :aria-label="`Loading ${label}`" indeterminate />
  </div>
</template>

<script lang="ts" setup>
import { PagingStatus } from '@/stores/messaging/pages';

// One end of a message list with more past it: a loader, or a retry after
// a failure
defineProps<{
  status: PagingStatus;
  // What is past it, e.g. "earlier messages"
  label: string;
}>();

const emit = defineEmits<{ retry: [] }>();
</script>
