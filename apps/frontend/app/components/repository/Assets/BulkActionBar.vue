<template>
  <BulkActionBar
    :count="selected.size"
    :is-all-selected="isAllSelected"
    @clear="$emit('clear')"
    @toggle-all="$emit('toggle-all', $event)"
  >
    <template v-if="mdAndUp">
      <div v-tooltip:top="indexTooltip">
        <VBtn
          :disabled="!hasIndexable || isIndexing"
          :loading="isIndexing"
          color="secondary"
          prepend-icon="mdi-brain"
          rounded="pill"
          size="small"
          text="Index"
          variant="tonal"
          @click="$emit('index')"
        />
      </div>
      <VBtn
        prepend-icon="mdi-folder-move-outline"
        rounded="pill"
        size="small"
        text="Move"
        variant="tonal"
        @click="$emit('move')"
      />
    </template>
    <VBtn
      :loading="isBulkDeleting"
      :disabled="isBulkDeleting"
      color="error"
      prepend-icon="mdi-trash-can-outline"
      rounded="pill"
      size="small"
      text="Delete"
      variant="tonal"
      @click="$emit('delete')"
    />
    <VMenu v-if="!mdAndUp">
      <template #activator="{ props: menuProps }">
        <VBtn
          v-bind="menuProps"
          aria-label="More actions"
          icon="mdi-dots-vertical"
          size="small"
          variant="text"
          density="comfortable"
        />
      </template>
      <VList density="compact" nav>
        <VListItem
          :disabled="!hasIndexable || isIndexing"
          prepend-icon="mdi-brain"
          title="Index"
          @click="$emit('index')"
        />
        <VListItem
          prepend-icon="mdi-folder-move-outline"
          title="Move"
          @click="$emit('move')"
        />
      </VList>
    </VMenu>
  </BulkActionBar>
</template>

<script lang="ts" setup>
import type { Asset } from '@tailor-cms/interfaces/asset';
import { ProcessingStatus } from '@tailor-cms/interfaces/asset';
import { canIndex } from './utils';
import { oneLine } from 'common-tags';
import { useDisplay } from 'vuetify';
import BulkActionBar from '@/components/common/BulkActionBar.vue';

const props = defineProps<{
  selected: Map<number, Asset>;
  isAllSelected: boolean;
  isIndexing: boolean;
  isBulkDeleting: boolean;
}>();

defineEmits<{
  'index': [];
  'move': [];
  'delete': [];
  'clear': [];
  'toggle-all': [selected: boolean];
}>();

// Below md, Index and Move fold into a menu.
const { mdAndUp } = useDisplay();

// props.selected is a Map, so spread its values into an array the index
// checks below can filter/iterate over
const selectedAssets = computed(() => [...props.selected.values()]);

const indexableCount = computed(
  () => selectedAssets.value.filter((a) => canIndex(a)).length,
);

const hasIndexable = computed(() => indexableCount.value > 0);

const indexTooltip = computed(() => {
  const total = props.selected.size;
  const items = total === 1 ? 'item' : 'items';
  if (indexableCount.value > 0) {
    return `${indexableCount.value} of ${total} selected ${items} can be indexed`;
  }
  const allIndexed = selectedAssets.value.every(
    (a) => a.processingStatus === ProcessingStatus.Completed,
  );
  if (allIndexed) {
    return `Selected ${items} ${total === 1 ? 'is' : 'are'} already indexed.`;
  }
  return oneLine`
    None of the ${total} selected ${items} can be indexed - add a
    description or tags to make an asset eligible.
  `;
});
</script>
