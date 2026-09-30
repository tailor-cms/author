<template>
  <div class="d-flex align-center ga-1 text-body-small text-medium-emphasis">
    <VIcon icon="mdi-subdirectory-arrow-right" size="12" />
    <span v-if="isReplyTarget">Also sent to the channel</span>
    <VBtn
      v-else
      class="px-0 font-weight-bold"
      color="primary"
      density="compact"
      size="small"
      text="Replied to a thread"
      variant="plain"
      @click="emit('open')"
    />
  </div>
</template>

<script lang="ts" setup>
defineProps<{ isReplyTarget?: boolean }>();

const emit = defineEmits<{ open: [] }>();
</script>
