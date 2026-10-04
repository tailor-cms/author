<template>
  <TailorDialog
    v-model="isOpen"
    header-icon="mdi-folder-multiple-outline"
    title="Shared files"
    width="720"
    closeable
    scrollable
  >
    <template #subheader>
      <div class="px-5 pb-3">
        <div class="text-body-medium text-medium-emphasis mb-3">
          Everything attached to a message, most recent first.
        </div>
        <VChipGroup v-model="scope" color="primary" mandatory>
          <VChip
            v-for="option in SCOPES"
            :key="option.value"
            :text="option.label"
            :value="option.value"
            density="comfortable"
            rounded="pill"
            size="small"
            variant="tonal"
          />
        </VChipGroup>
      </div>
      <VDivider />
    </template>
    <template #body>
      <div v-if="isLoading" class="d-flex flex-wrap ga-3 py-2">
        <VSkeletonLoader
          v-for="it in 6"
          :key="it"
          class="rounded-lg"
          type="image"
          width="8rem"
        />
      </div>
      <VEmptyState
        v-else-if="!items.length"
        icon="mdi-paperclip-off"
        text="Files and links attached to messages collect here."
        title="Nothing shared yet"
      />
      <div v-else class="d-flex flex-wrap ga-3 py-4">
        <AssetTile
          v-for="item in items"
          :key="item.entityId"
          :reference="{ entityType: 'asset', entityId: item.entityId }"
        >
          <template #subtitle>
            Shared {{ formatTimeAgo(new Date(item.lastSharedAt)) }}
          </template>
        </AssetTile>
      </div>
    </template>
  </TailorDialog>
</template>

<script lang="ts" setup>
import { TailorDialog } from '@tailor-cms/core-components';
import { formatTimeAgo } from '@vueuse/core';
import { useMessagingStore } from '@/stores/messaging';

import AssetTile from '../AssetTile.vue';

interface SharedAsset {
  entityId: string;
  lastSharedAt: string;
}

type Scope = 'thread' | 'all';

const SCOPES: { value: Scope; label: string }[] = [
  { value: 'thread', label: 'This thread' },
  { value: 'all', label: 'All threads' },
];

const props = defineProps<{
  repositoryId: number;
  threadId?: number | null;
}>();

const isOpen = defineModel<boolean>({ default: false });

const messagingStore = useMessagingStore();

const scope = ref<Scope>('thread');
const items = ref<SharedAsset[]>([]);
const isLoading = ref(false);

const load = async (isStale: () => boolean) => {
  const threadId =
    scope.value === 'thread' ? (props.threadId ?? undefined) : undefined;
  isLoading.value = true;
  try {
    const { items: assets } = await messagingStore.listAssets(
      props.repositoryId,
      threadId,
    );
    // Switching scope mid-load keeps only the latest answer
    if (!isStale()) items.value = assets;
  } finally {
    if (!isStale()) isLoading.value = false;
  }
};

watch(
  [isOpen, scope],
  ([open], _, onCleanup) => {
    if (!open) return;
    let isStale = false;
    onCleanup(() => (isStale = true));
    load(() => isStale);
  },
  { immediate: true },
);
</script>
