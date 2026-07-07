<template>
  <TailorEmptyState
    v-bind="$attrs"
    height="auto"
    text="Create your first repository from one of the available schemas,
      or import a previously exported archive."
    text-width="440"
    title="No repositories yet"
    variant="text"
  >
    <template #actions>
      <div class="d-flex flex-wrap justify-center ga-4 mt-4">
        <EmptyStateCard
          v-for="option in options"
          :key="option.key"
          :icon="option.icon"
          :test-id="option.testId"
          :text="option.text"
          :title="option.title"
          @click="dialogTab = option.tab"
        />
      </div>
    </template>
  </TailorEmptyState>
  <AddRepository
    v-if="dialogTab"
    :default-tab="dialogTab"
    :is-create-enabled="true"
    :show-activator="false"
    @close="dialogTab = null"
    @created="emit('created')"
  />
</template>

<script lang="ts" setup>
import { TailorEmptyState } from '@tailor-cms/core-components';

import AddRepository from '@/components/catalog/AddRepository/index.vue';
import EmptyStateCard from '@/components/common/EmptyStateCard.vue';

const emit = defineEmits(['created']);

// Tab ids of the AddRepository dialog.
const dialogTab = ref<string | null>(null);

const options = [
  {
    key: 'create',
    tab: 'schema',
    title: 'Create repository',
    text: 'Start fresh from one of the available schemas.',
    testId: 'catalog__emptyCreate',
    icon: 'mdi-folder-plus-outline',
  },
  {
    key: 'import',
    tab: 'import',
    title: 'Import repository',
    text: 'Restore a previously exported archive.',
    testId: 'catalog__emptyImport',
    icon: 'mdi-import',
  },
];
</script>
