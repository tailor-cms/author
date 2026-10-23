<template>
  <div class="d-flex align-center ga-1 mb-3">
    <h2 class="text-title-medium font-weight-bold">Threads</h2>
    <VChip
      v-if="unread.mentions"
      :text="`${unread.mentions}`"
      class="mentions-chip ml-2"
      color="tertiary"
      prepend-icon="mdi-at"
      rounded="pill"
      size="x-small"
      variant="flat"
    />
    <VSpacer />
    <VBtn
      v-tooltip:bottom="'New thread'"
      aria-label="New thread"
      density="comfortable"
      icon="mdi-square-edit-outline"
      size="small"
      variant="text"
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
    <VBtn
      v-tooltip:bottom="{ text: 'Collapse sidebar', openDelay: 500 }"
      aria-label="Collapse sidebar"
      class="collapse-btn ml-1"
      density="comfortable"
      icon="mdi-chevron-double-left"
      size="small"
      variant="tonal"
      @click="emit('collapse')"
    />
  </div>
</template>

<script lang="ts" setup>
defineProps<{
  unread: { threads: number; mentions: number };
  hasIntegrationAccess?: boolean;
}>();

const emit = defineEmits<{
  'collapse': [];
  'start:thread': [];
  'clear:unread': [];
  'manage:integrations': [];
}>();
</script>

<style lang="scss" scoped>
.collapse-btn {
  opacity: 0.7;
  transition: opacity 160ms ease;

  &:hover {
    opacity: 1;
  }
}
</style>
