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
        <div v-for="item in items" :key="item.entityId" class="shared-item">
          <ThumbnailTile
            :reference="{ entityType: 'asset', entityId: item.entityId }"
          />
          <div class="text-body-small text-medium-emphasis text-truncate mt-1">
            {{ formatTimeAgo(new Date(item.lastSharedAt)) }}
          </div>
        </div>
      </div>
    </template>
  </TailorDialog>
</template>

<script lang="ts" setup>
import { TailorDialog } from '@tailor-cms/core-components';
import { formatTimeAgo } from '@vueuse/core';
import { useDiscussionStore } from '@/stores/discussion';

import ThumbnailTile from '../ThumbnailTile.vue';

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

const discussionStore = useDiscussionStore();

const scope = ref<Scope>('thread');
const items = ref<SharedAsset[]>([]);
const isLoading = ref(false);

const load = async (isStale: () => boolean) => {
  const threadId =
    scope.value === 'thread' ? (props.threadId ?? undefined) : undefined;
  isLoading.value = true;
  try {
    const { items: assets } = await discussionStore.listAssets(
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

<style lang="scss" scoped>
.shared-item {
  width: 8rem;
}
</style>
