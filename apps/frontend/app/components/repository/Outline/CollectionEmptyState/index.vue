<template>
  <TailorEmptyState
    height="auto"
    text="Nothing in this collection yet — create an item from scratch, or
      bring one in from another repository."
    text-width="440"
    title="No items yet"
    variant="text"
  >
    <template #actions>
      <div class="actions d-flex flex-wrap justify-center ga-4 mt-4">
        <EmptyStateCard
          v-for="option in options"
          :key="option.key"
          :icon="option.icon"
          :test-id="option.testId"
          :text="option.text"
          :title="option.title"
          @click="option.open"
        />
      </div>
    </template>
  </TailorEmptyState>
  <CreateDialog
    v-if="isCreateOpen"
    :default-type="selectedEntity"
    :repository-id="repositoryId"
    test-id-prefix="repository__createCollectionItem"
    open-in-editor
    @close="isCreateOpen = false"
  />
  <CopyDialog
    v-if="isCopyOpen"
    :action="AddAfter"
    :levels="entityTypes"
    :repository-id="repositoryId"
    @close="isCopyOpen = false"
  />
  <LinkContent
    v-if="isLinkOpen"
    :action="AddAfter"
    @close="isLinkOpen = false"
  />
</template>

<script lang="ts" setup>
import { InsertLocation } from '@tailor-cms/utils';
import { TailorEmptyState } from '@tailor-cms/core-components';

import CopyDialog from '@/components/repository/Outline/CopyActivity/index.vue';
import CreateDialog from '@/components/repository/Outline/CreateDialog/index.vue';
import EmptyStateCard from '@/components/common/EmptyStateCard.vue';
import LinkContent from '@/components/repository/Library/LinkContent.vue';
import { useConfigStore } from '@/stores/config';
import { useCurrentRepository } from '@/stores/current-repository';

withDefaults(defineProps<{ selectedEntity?: string }>(), {
  selectedEntity: '',
});

const { AddAfter } = InsertLocation;

const { $eventBus } = useNuxtApp() as any;
const configStore = useConfigStore();
const currentRepositoryStore = useCurrentRepository();

const repositoryId = computed(
  () => currentRepositoryStore.repositoryId as number,
);

// A collection is flat, so copying offers its root-level item types.
const { sameLevel } = useSelectedActivity(null);
const entityTypes = computed(() => sameLevel.value.map((it: any) => it.type));

const isCreateOpen = ref(false);
const isCopyOpen = ref(false);
const isLinkOpen = ref(false);

// Hands the prompt off to the agent panel; the user reviews and sends.
const openRenoir = () =>
  $eventBus.channel('agent').emit('prompt:set', {
    prompt: 'Draft an initial set of items for this collection.',
  });

const options = computed(() => [
  {
    key: 'create',
    title: 'Create item',
    text: 'Start from scratch and add a new item.',
    icon: 'mdi-file-document-plus-outline',
    testId: 'repository__emptyCreate',
    open: () => (isCreateOpen.value = true),
  },
  {
    key: 'copy',
    title: 'Copy item',
    text: 'Duplicate an item from another repository.',
    icon: 'mdi-content-copy',
    testId: 'repository__emptyCopy',
    open: () => (isCopyOpen.value = true),
  },
  {
    key: 'link',
    title: 'Link item',
    text: 'Reuse a live copy that stays in sync.',
    icon: 'mdi-link-box-outline',
    testId: 'repository__emptyLink',
    open: () => (isLinkOpen.value = true),
  },
  ...(configStore.isAiAvailable
    ? [
        {
          key: 'renoir',
          title: 'Draft with Renoir',
          text: 'Have the AI agent draft your items.',
          icon: 'mdi-robot-outline',
          testId: 'repository__emptyRenoir',
          open: openRenoir,
        },
      ]
    : []),
]);
</script>

<style lang="scss" scoped>
.actions {
  max-width: 1000px;
}
</style>
