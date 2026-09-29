<template>
  <div class="d-flex align-center ga-1 mb-3">
    <h2 class="text-title-medium font-weight-bold">Threads</h2>
    <VChip
      v-if="unread.mentions"
      :text="`${unread.mentions}`"
      class="ml-2"
      color="secondary"
      prepend-icon="mdi-at"
      rounded="pill"
      size="x-small"
      variant="flat"
    />
    <VSpacer />
    <VBtn
      color="primary"
      prepend-icon="mdi-plus"
      size="small"
      text="New"
      variant="tonal"
      @click="emit('start:thread')"
    />
    <VMenu location="bottom end">
      <template #activator="{ props: menuProps }">
        <VBtn
          v-bind="menuProps"
          aria-label="Thread list actions"
          density="comfortable"
          icon="mdi-dots-vertical"
          size="small"
          variant="text"
        />
      </template>
      <VList density="compact" min-width="240" nav>
        <VListItem
          :disabled="!unread.threads"
          prepend-icon="mdi-check-all"
          rounded="lg"
          subtitle="Clears the badge on every conversation"
          title="Mark everything read"
          @click="emit('clear:unread')"
        />
        <VListItem
          v-if="hasIntegrationAccess"
          prepend-icon="mdi-webhook"
          rounded="lg"
          subtitle="Let an outside system post into a thread"
          title="Integrations"
          @click="emit('manage:integrations')"
        />
      </VList>
    </VMenu>
  </div>
</template>

<script lang="ts" setup>
defineProps<{
  unread: { threads: number; mentions: number };
  hasIntegrationAccess?: boolean;
}>();

const emit = defineEmits<{
  'start:thread': [];
  'clear:unread': [];
  'manage:integrations': [];
}>();
</script>
