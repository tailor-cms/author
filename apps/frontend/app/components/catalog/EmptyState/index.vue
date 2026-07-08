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
        <AddRepository
          v-for="option in options"
          :key="option.tab"
          :default-tab="option.tab"
          :is-create-enabled="true"
          @created="emit('created')"
        >
          <template #activator="{ props: activatorProps }">
            <EmptyStateCard
              v-bind="activatorProps"
              :icon="option.icon"
              :test-id="option.testId"
              :text="option.text"
              :title="option.title"
            />
          </template>
        </AddRepository>
      </div>
    </template>
  </TailorEmptyState>
</template>

<script lang="ts" setup>
import { TailorEmptyState } from '@tailor-cms/core-components';

import AddRepository from '@/components/catalog/AddRepository/index.vue';
import EmptyStateCard from '@/components/common/EmptyStateCard.vue';

const emit = defineEmits(['created']);

const options = [
  {
    tab: 'schema',
    title: 'Create repository',
    text: 'Start fresh from one of the available schemas.',
    testId: 'catalog__emptyCreate',
    icon: 'mdi-folder-plus-outline',
  },
  {
    tab: 'import',
    title: 'Import repository',
    text: 'Restore a previously exported archive.',
    testId: 'catalog__emptyImport',
    icon: 'mdi-import',
  },
];
</script>
