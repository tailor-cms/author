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
      <div class="px-5 text-body-medium text-medium-emphasis">
        Everything attached to a message, most recent first.
      </div>
    </template>
    <template #body>
      <VChipGroup v-model="scope" mandatory>
        <VChip
          v-for="{ value, label } in SCOPES"
          :key="value"
          :text="label"
          :value="value"
          color="secondary"
          role="button"
          rounded="lg"
          size="small"
          filter
        />
      </VChipGroup>
      <div
        v-if="isSkeletonVisible && !items.length"
        class="d-flex flex-wrap ga-3 py-2"
      >
        <VSkeletonLoader
          v-for="it in 6"
          :key="it"
          class="rounded-lg"
          type="image"
          width="8rem"
        />
      </div>
      <TailorEmptyState
        v-else-if="hasLoaded && !items.length"
        class="my-8"
        height="auto"
        icon="mdi-paperclip-off"
        size="48"
        text="Files and links attached to messages collect here."
        text-width="320"
        title="Nothing shared yet"
        variant="text"
      />
      <div
        v-else-if="items.length"
        :class="{ 'opacity-70': isLoading }"
        class="d-flex flex-wrap ga-3 py-2"
      >
        <SharedAssetTile
          v-for="item in items"
          :key="item.entityId"
          :reference="{ entityType: ReferenceType.Asset, entityId: item.entityId }"
          color="surface-overlay"
        >
          <template #subtitle>
            Shared {{ formatTimeAgo(new Date(item.lastSharedAt)) }}
          </template>
        </SharedAssetTile>
      </div>
    </template>
  </TailorDialog>
</template>

<script lang="ts" setup>
import { TailorDialog, TailorEmptyState } from '@tailor-cms/core-components';
import { formatTimeAgo } from '@vueuse/core';
import { ReferenceType } from '@tailor-cms/interfaces/comment';
import { useMessagingStore } from '@/stores/messaging';

import SharedAssetTile from '../SharedAssetTile.vue';

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
// Until the first answer, an empty list means nothing is known yet
const hasLoaded = ref(false);
const isSkeletonVisible = useSkeletonDelay(isLoading);

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
    if (isStale()) return;
    items.value = assets;
    hasLoaded.value = true;
  } finally {
    if (!isStale()) isLoading.value = false;
  }
};

watch(
  [isOpen, scope],
  ([open], _, onCleanup) => {
    if (!open) {
      // Reopened later, possibly for another thread
      items.value = [];
      hasLoaded.value = false;
      return;
    }
    let isStale = false;
    onCleanup(() => (isStale = true));
    load(() => isStale);
  },
  { immediate: true },
);
</script>
