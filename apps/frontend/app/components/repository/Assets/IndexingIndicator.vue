<template>
  <IndicatorCard
    v-if="indexingStore.items.length"
    :is-clearable="indexingStore.hasCompleted"
    :title="headerText"
    clear-label="Clear finished indexing"
    icon="mdi-brain"
    @clear="indexingStore.clearCompleted()"
  >
    <VListItem
      v-for="item in indexingStore.items"
      :key="`${item.repositoryId}-${item.id}`"
      class="indexing-item py-2 px-4"
    >
      <template #prepend>
        <VProgressCircular
          v-if="isActiveStatus(item.status)"
          class="mr-3"
          color="tertiary"
          size="18"
          width="2"
          indeterminate
        />
        <VIcon
          v-else
          :color="iconColor(item)"
          :icon="iconFor(item)"
          size="small"
        />
      </template>
      <VListItemTitle class="text-body-medium">
        {{ item.name }}
      </VListItemTitle>
      <VListItemSubtitle class="text-body-small">
        {{ subtitleFor(item) }}
      </VListItemSubtitle>
    </VListItem>
  </IndicatorCard>
</template>

<script lang="ts" setup>
import {
  type IndexingItem,
  isActiveStatus,
  useIndexingStore,
} from '@/stores/indexing';
import IndicatorCard from '@/components/common/IndicatorCard.vue';
import { ProcessingStatus } from '@tailor-cms/interfaces/asset';

const indexingStore = useIndexingStore();

const headerText = computed(() => {
  const total = indexingStore.items.length;
  if (indexingStore.activeCount > 0) {
    const done = total - indexingStore.activeCount;
    return `Indexing ${done} of ${total} complete`;
  }
  const hasErrors = indexingStore.items.some(
    (it) => it.status === ProcessingStatus.Failed,
  );
  return hasErrors ? 'Indexing finished with errors' : 'Indexing complete';
});

const iconFor = (item: IndexingItem) =>
  item.status === ProcessingStatus.Failed
    ? 'mdi-alert-circle'
    : 'mdi-check-circle';

const iconColor = (item: IndexingItem) =>
  item.status === ProcessingStatus.Failed ? 'error' : 'success';

const subtitleFor = (item: IndexingItem) => {
  if (item.status === ProcessingStatus.Failed)
    return item.error ?? 'Indexing failed';
  if (item.status === ProcessingStatus.Completed) return 'Indexed';
  if (item.status === ProcessingStatus.Processing) return 'Processing…';
  return 'Queued';
};
</script>
