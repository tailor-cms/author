<template>
  <VTextField
    v-model="name"
    class="mb-2"
    density="compact"
    placeholder="Find a conversation"
    prepend-inner-icon="mdi-filter-variant"
    rounded="lg"
    variant="solo-filled"
    clearable
    flat
    hide-details
  />
  <VChipGroup
    v-model="scope"
    class="scope-filters"
    color="primary"
    selected-class="font-weight-semibold"
    column
    mandatory
  >
    <VChip
      v-for="option in SCOPES"
      :key="option.value"
      :prepend-icon="option.icon"
      :text="option.label"
      :value="option.value"
      density="comfortable"
      rounded="pill"
      size="small"
      variant="tonal"
    />
  </VChipGroup>
</template>

<script lang="ts" setup>
import type { ThreadScope } from '@/stores/messaging';

const scope = defineModel<ThreadScope>('scope', { default: 'all' });
const name = defineModel<string>('name', { default: '' });

const SCOPES: { value: ThreadScope; label: string; icon: string }[] = [
  { value: 'all', label: 'All', icon: 'mdi-forum-outline' },
  { value: 'unread', label: 'Unread', icon: 'mdi-email-outline' },
  { value: 'mentions', label: 'Mentions', icon: 'mdi-at' },
  { value: 'unresolved', label: 'Open', icon: 'mdi-progress-check' },
  { value: 'mine', label: 'Mine', icon: 'mdi-account-outline' },
];
</script>

<style lang="scss" scoped>
.scope-filters :deep(.v-slide-group__content) {
  gap: 0.25rem;
  padding: 0;
}
</style>
