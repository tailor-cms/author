<template>
  <VTextField
    v-model="name"
    class="mb-2"
    bg-color="surface-container"
    density="compact"
    placeholder="Find a conversation"
    prepend-inner-icon="mdi-magnify"
    rounded="lg"
    variant="solo"
    clearable
    flat
    hide-details
  />
  <EntityFilter
    v-model="scope"
    :entities="SCOPES"
    class="scope-filters"
    rounded="lg"
    column
  />
</template>

<script lang="ts" setup>
import type { ThreadScope } from '@/stores/messaging';

import EntityFilter from '@/components/repository/Outline/EntityFilter.vue';

const scope = defineModel<ThreadScope>('scope', { default: 'all' });
const name = defineModel<string>('name', { default: '' });

const SCOPES: { value: ThreadScope; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'mentions', label: 'Mentions' },
  { value: 'unresolved', label: 'Open' },
  { value: 'mine', label: 'Mine' },
];
</script>
