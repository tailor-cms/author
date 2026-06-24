<template>
  <VMenu location="bottom end">
    <template #activator="{ props: menuProps }">
      <VBtn
        v-bind="menuProps"
        aria-label="Actions"
        icon="mdi-dots-vertical"
        size="small"
        variant="text"
        density="comfortable"
        @click.stop
      />
    </template>
    <VList density="compact" nav>
      <VListItem
        v-for="it in menuOptions"
        :key="it.name"
        :base-color="it.color"
        :prepend-icon="it.icon"
        :title="it.name"
        @click="it.action"
      />
    </VList>
  </VMenu>
</template>

<script lang="ts" setup>
import { AssetType, ProcessingStatus } from '@tailor-cms/interfaces/asset';
import type { Asset } from '@tailor-cms/interfaces/asset';

import { isIndexable } from './utils';

const props = defineProps<{ asset: Asset }>();

const emit = defineEmits<{
  download: [asset: Asset];
  index: [asset: Asset];
  deindex: [asset: Asset];
  move: [asset: Asset];
  delete: [asset: Asset];
}>();

const canDownload = computed(
  () => props.asset.type !== AssetType.Link && !!props.asset.storageKey,
);

const canDeindex = computed(
  () => props.asset.processingStatus === ProcessingStatus.Completed,
);

const canIndex = computed(
  () => !canDeindex.value && isIndexable(props.asset),
);

const menuOptions = computed(() => {
  const items = [];
  if (canDownload.value) {
    items.push({
      name: 'Download',
      icon: 'mdi-download',
      action: () => emit('download', props.asset),
    });
  }
  if (canDeindex.value) {
    items.push({
      name: 'De-index',
      icon: 'mdi-text-search-variant',
      action: () => emit('deindex', props.asset),
    });
  } else if (canIndex.value) {
    items.push({
      name: 'Index',
      icon: 'mdi-brain',
      action: () => emit('index', props.asset),
    });
  }
  items.push(
    {
      name: 'Move to...',
      icon: 'mdi-folder-move-outline',
      action: () => emit('move', props.asset),
    },
    {
      name: 'Delete',
      icon: 'mdi-trash-can-outline',
      color: 'error',
      action: () => emit('delete', props.asset),
    },
  );
  return items;
});
</script>
